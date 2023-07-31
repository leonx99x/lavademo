import React, { useState, useEffect } from 'react';
import { interval, from, forkJoin, of} from 'rxjs';
import { switchMap, map, filter, catchError } from 'rxjs/operators';
import { LavaSDK } from "@lavanet/lava-sdk";
import { Tx } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { fromBase64 } from '@cosmjs/encoding';
import * as LavaJs from "@lavanet/lavajs";
import axios from 'axios';
import chainIdToNameMap from 'chainIndex';

/**
 * gets the latest block data
 * @returns 
 */
async function fetchLatestBlock(lavaNet:LavaSDK) {
  // Replace this with your actual request code
  const response = await lavaNet.sendRelay({
    method: "GET",
    url: "/cosmos/base/tendermint/v1beta1/blocks/latest",
  });
  const information = JSON.parse(response);
  return information;
}
/**
 * fetches spesific block data, since ladasdk had problems getting it used axios
 * @param height height of the block that is to be fetched
 * @returns spesific block data
 */
async function fetchBlock(height: number) {
  const url = `https://g.w.lavanet.xyz:443/gateway/lav1/rest/cd735a76b298b7dca7fd0c6e44381023/cosmos/base/tendermint/v1beta1/blocks/${height}`;
  const response = await axios.get(url);
  return response.data;
}
/**
   * gets height of the block
   * @param information JSON object
   * @returns number as height
   */
const getHeight = async (information: any) => {
  try {
    const height = information.block.header.height;
    //console.log("height" + height);
    return height;
  } catch (err) {
    console.error(err);
  }
};
/**
 * Process the block data to get the relay.specId and relayNum fields and store it in a dictionary
 * @param information JSON object
 * @returns blockData dictionary
 */
function processBlockData(information:any) {
  const blockData: Record<string, number> = {};
  if (information.block && information.block.data && information.block.data.txs) {
    information.block.data.txs.forEach((tx: any) => {
      const txBytes = fromBase64(tx);
      const decodedTx = Tx.decode(txBytes);//decode the transaction
      if (decodedTx.body?.messages) {
        decodedTx.body.messages.forEach(message => {
          if (message.typeUrl === "/lavanet.lava.pairing.MsgRelayPayment") {//check if the message type is MsgRelayPayment
            const decodedMessage = LavaJs.lavanet.lava.pairing.MsgRelayPayment.decode(message.value);
            if (decodedMessage.relays) {
              decodedMessage.relays.forEach(relay => {
                if (!(relay.specId in blockData)) {
                  blockData[relay.specId] = 0;
                }
                blockData[relay.specId] += relay.relayNum.toNumber();
              });
            }
          }
        });
      }
    });
  }
  return Object.keys(blockData).length > 0 ? { [information.block.header.height]: blockData } : {};
}

type ChainData = {
  specId: string;
  relayNum: any; // Use a more specific type if possible
};

function App() {
  const [blocksData, setBlocksData] = useState<Record<number, any> | null>(null);//holds the block data
  const [lavaNet, setLavaNet] = useState<LavaSDK>();//holds the LavaSDK instance
  const [prevHeight, setPrevHeight] = useState(0);//holds the previous height to compare with last response height
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true); //loading indicator state before fetching data of 20 blocks
  const [initialFetchCompleted, setInitialFetchCompleted] = useState(false);//initiasl 20 block data fetch completed state
  const [sortedChainDataArray, setSortedChainDataArray] = useState<ChainData[]>([]);

  /**
   * Initialize the LavaSDK instance and fetch 20 blocks of data at start
   */
  useEffect(() => {
    setIsLoading(true);
    const badge = {
      badgeServerAddress: "https://badges.lavanet.xyz",
      projectId: "cd735a76b298b7dca7fd0c6e44381023",
    };
  
    const initializeLavaNet = async () => {
      try {
        const lavaInstance = await new LavaSDK({
          badge: badge,
          chainID: "LAV1",
          rpcInterface: "rest",
          geolocation: "2",
        });
        setLavaNet(lavaInstance);
  
        const latestBlock = await fetchLatestBlock(lavaInstance);
        const latestHeight = await getHeight(latestBlock);
        const startHeight = Math.max(latestHeight - 20, 1);
  
        // Make an array of all block heights we want to fetch (latest 20 blocks)
        const heights = Array.from({length: 20}, (_, i) => latestHeight - i).reverse();
  
        // Use from() to convert the array to an observable sequence
        // Then use map() to replace each height with an Observable of its processed block data
        // Use toArray() to collect all block data back into a single array when all fetches complete
        forkJoin(
          // For each height, create an Observable that fetches and processes the block
          heights.map(height =>
            from(fetchBlock(height)).pipe(
              map(block => {
                //console.log(`Processing block for height ${height}`);
                const processedBlock = processBlockData(block);
                //console.log(`Finished processing block for height ${height}`);
                return processedBlock;
              }),
              filter(data => data !== null),
              catchError(err => {
                //console.error(`Error processing block at height ${height}: ${err}`);
                return of(null);  // Return null to continue processing the next block
              }) // Ignore blocks with no data
            )
          )
        ).subscribe({
          next: initialBlocksData => {  // This runs when all block data has been fetched
            //console.log("setting initialBlocksData");
            setBlocksData(initialBlocksData.reduce((acc, curr) => ({ ...acc, ...curr }), {}));
            setIsLoading(false);
            setInitialFetchCompleted(true);
            //console.log("initial fetch completed");
            //console.log(initialBlocksData);
          },
          error: err => {
            console.error(`Error encountered: ${err}`);
            setError(err as Error);
          }
        });
      } catch (err) {
        setError(err as Error);
      }
    };
    initializeLavaNet();
  }, []);
  
/**
 * Fetch the latest block every 5 seconds and process it, used rxjs to stream data to the table
 */
  useEffect(() => {
    if (lavaNet && initialFetchCompleted) {
      const subscription = interval(5000).pipe(
        switchMap(async () => {
          const latestBlock = await fetchLatestBlock(lavaNet);
          //console.log(`Fetched latest block at height ${latestBlock.block.header.height}`);
          const latestHeight = await getHeight(latestBlock);
          //console.log(`Latest height: ${latestHeight}`);
          let newBlocksData = {};
          // If there are missing blocks, fetch and process them
          if (prevHeight === 0) {
            setPrevHeight(latestHeight);
          } else {
            // If there are missing blocks, fetch and process them
            if (latestHeight - prevHeight > 1) {
              for (let height = prevHeight + 1; height < latestHeight; height++) {
                const block = await fetchBlock(height);
                newBlocksData = { ...newBlocksData, ...processBlockData(block) };
              }
            }
          }

          // Process the latest block and update prevHeight
          // Process the latest block and update prevHeight
          const processedBlockData = await new Promise(resolve => {
            resolve(processBlockData(latestBlock));
          });
          if (typeof processedBlockData === 'object' && processedBlockData !== null) {
            newBlocksData = { ...newBlocksData, ...processedBlockData };
          }
          setPrevHeight(latestHeight);

          return newBlocksData;
        })
      ).subscribe(blockData => {
        // Keep only the data from the last 20 blocks
        const allBlocksData: Record<number, any> = { ...blocksData, ...blockData };
        const blockHeights = Object.keys(allBlocksData).map(Number).sort((a, b) => b - a);
        while (blockHeights.length > 20) {
          const oldestHeight = blockHeights.pop()!;
          delete allBlocksData[oldestHeight];
          console.log(`Deleted block data for height ${oldestHeight}`);
        }
        //console.log("setting blocksData");
        //console.log("allBlocksData" + JSON.stringify(allBlocksData));
        setBlocksData(allBlocksData);
      });
      return () => subscription.unsubscribe();
    }
  }, [lavaNet, prevHeight, initialFetchCompleted]);

  //chain data is the sum of relayNum for each chain
  let chainData: Record<string, any> = {}; 
  for (const blockHeight in blocksData) {
    const blockHeightNumber = Number(blockHeight);
    for (const chainName in blocksData[blockHeightNumber]) {
        if (!chainData[chainName]) {
            chainData[chainName] = 0;
        }
        chainData[chainName] += blocksData[blockHeightNumber][chainName];
    }
}

// Transform your object into an array to sort
useEffect(() => {
  const chainDataArray = Object.entries(chainData).map(([specId, relayNum]) => ({ specId, relayNum }));
  const sortedArray = chainDataArray.sort((a, b) => b.relayNum - a.relayNum).slice(0, 10);
  setSortedChainDataArray(sortedArray);
}, [chainData]);

useEffect(() => {
  if (!sortedChainDataArray || sortedChainDataArray.length === 0) {
    setIsLoading(true);
  } else {
    setIsLoading(false);
  }
}, [sortedChainDataArray]);
return (
  <div className="relative overflow-x-auto flex justify-center">
  {isLoading ? (
    <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  ) : (
    <div className="flex">
      <div className="m-4">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-900 uppercase dark:text-gray-400">
            <tr>
              <th>Chain Name</th>
            </tr>
          </thead>
          <tbody>
            {sortedChainDataArray.map((chain, index) => 
              <tr key={index}>
                <td>{chainIdToNameMap[chain.specId as keyof typeof chainIdToNameMap]}</td> 
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="m-4">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-900 uppercase dark:text-gray-400">
            <tr>
              <th>Number of Relays</th>
            </tr>
          </thead>
          <tbody>
            {sortedChainDataArray.map((chain, index) => 
              <tr key={index}>
                <td>{chain.relayNum}</td> 
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>
);
}

export default App;
