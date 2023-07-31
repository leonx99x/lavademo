# Project Title

This project is a React application that interacts with the Lava Network blockchain. It retrieves the most recent blocks and processes each block to get the `relay.specId` and `relayNum` fields. This data is then displayed in a simple table.

## Getting Started

### Prerequisites

- Node.js (version 14.x.x)
- Yarn (version 1.x.x)
- Docker (optional)

### Installing Dependencies

In your project directory, install the required dependencies by running the following command:

```bash
yarn install
```

This will install all the necessary packages specified in the package.json file, including react, rxjs, @lavanet/lava-sdk, axios and @cosmjs/encoding.

### Running the Application Locally

To run the application locally, use the following command in your project directory:

bash
Copy code
yarn start
This will start the development server and the application will be available at http://localhost:3000.

### Building the Application

To build the application for production, run the following command:

bash
Copy code
yarn build
This will create a build directory with the production-ready static files.

### Running the Application with Docker

If you have Docker installed, you can build a Docker image and run the application inside a Docker container. Here's how to do it:

Build the Docker image:
bash
Copy code
docker build -t your-image-name .
Run the Docker container:
bash
Copy code
docker run -p 8080:80 your-image-name
With this, your application will be available at http://localhost:8080.

## Walkthrough

The application uses the LavaSDK library to interact with the Lava Network blockchain. The application has a main functional component, App, which utilizes several helper functions to fetch and process the block data.

fetchLatestBlock(lavaNet:LavaSDK): Fetches the latest block data from the Lava Network.

fetchBlock(height: number): Fetches a specific block data based on its height.

getHeight(information: any): Retrieves the height of a block from the block data.

processBlockData(information:any): Processes the block data to extract the relay.specId and relayNum fields and stores it in a dictionary.

In the App component, there are two useEffect hooks. The first one is used to initialize the LavaSDK instance and fetch the data of the most recent 20 blocks when the component mounts.

The second useEffect hook fetches the latest block every 5 seconds and processes it. If any blocks were missed (i.e., more than one block was added since the last fetch), it fetches and processes the missing blocks as well.

The processed block data is stored in the blocksData state variable, which is an object where each key is a block height and each value is another object mapping relay.specId to relayNum.

Finally, the App component renders a table with the relay.specId and relayNum of each block, sorted by relayNum in descending order.
