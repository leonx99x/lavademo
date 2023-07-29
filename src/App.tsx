import React, { useState, useEffect } from 'react';
import { LavaSDK } from "@lavanet/lava-sdk";
import { Tx, TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx"
import { fromBase64 } from '@cosmjs/encoding';
import { MsgRelayPayment } from "@lavanet/lavajs/src/codegen/pairing/tx";
import * as LavaJs from "@lavanet/lavajs";
import * as testJson from "./test.json"

function App() {
  const [info, setInfo] = useState('');
  

  useEffect(() => {
    let isMounted = true;  // This flag is used to prevent state updates after unmounting
    
    
    async function initializeSDK() {
      
      const lavaSDK = await new LavaSDK({
        badge: {
          badgeServerAddress: "https://badges.lavanet.xyz", // Or your own Badge-Server URL 
          projectId: "cd735a76b298b7dca7fd0c6e44381023"
        },
        chainID: "LAV1",
        rpcInterface:  "rest",
        geolocation: "2",
      });

      
      try {
        const test = await  ({ 
          method: "GET",
          url: "/cosmos/base/tendermint/v1beta1/blocks/latest",
        });
        const response = await lavaSDK.sendRelay({
          method: "GET",
          url: "/cosmos/base/tendermint/v1beta1/blocks/latest",
        });
        const arr = Object.values(testJson.value); // This gets the values from the object and puts them in an array
        const uint8Array = new Uint8Array(arr)
        console.log("result=" + LavaJs.lavanet.lava.pairing.MsgRelayPayment.decode(uint8Array).relays[0].provider);

        const information = JSON.parse(response);
        if (information.block && information.block.data && information.block.data.txs) {
          const decodedTxs = await Promise.all(information.block.data.txs.map(async (tx: string) => {
            const txBytes = fromBase64(tx);
            const decodedTx = Tx.decode(txBytes);
            //console.log(decodedTx);
            if(decodedTx.body?.messages[0]?.typeUrl === "/lavanet.lava.pairing.MsgRelayPayment")
            {
              //console.log(decodedTx);
              //console.log(LavaJs.lavanet.lava.pairing.MsgRelayPayment.decode(decodedTx.body?.messages[0]?.value).descriptionString);
            }  // Check if body and messages exist before decoding
            
            return null;
          }));
        
          if (isMounted) setInfo(JSON.stringify(decodedTxs));
        }
      } catch (error) {
        console.error(error);
      }
    }

    initializeSDK();

    return () => {
      isMounted = false;  // Mark the component as unmounted
    };
  }, []);

  return (
    <div>
      <h1>Node Info</h1>
      {info && 
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", backgroundColor: "#f5f5f5", padding: "10px" }}>
          {JSON.stringify(JSON.parse(info), null, 2)}
        </pre>}
    </div>
  );
}

export default App;
