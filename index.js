const { ChainId, Token, Fetcher, CELO, Route, Trade, TokenAmount,  TradeType, Percent } = require('@ubeswap/sdk')
const { CeloProvider, CeloWallet } = require('@celo-tools/celo-ethers-wrapper')
const { ethers, Wallet, BigNumber, providers } = require("ethers")

// contract addresses and ABIs
const { addressesTest  } = require('./utils.js')
const tokenABI = require("./ABIs/tokenAbI")

// connecting to Alfajores testnet
const provider = new CeloProvider('https://alfajores-forno.celo-testnet.org')

const chainId = ChainId.ALFAJORES

// wallet connection details
const seed = "0xe5e5aa6562d90f542d5d4f24244b228cc365797ed5c1a4a8eea5b623231c6bb9" // enter your wallet 12 word seed phrase
const to = "0xc8739959E413365255d82d86e6db157768B6DEAD" // should be a checksummed recipient address // enter your wallet address where to send the bought tokens
const wallet_ = "0x909b0dfe4267f7e2037807a71a9e06eca8ea23dc"

const amountIn = ethers.utils.parseUnits("0.1", "ether"); // equivalent to ~$0.10 USD

const wallet = new CeloWallet(seed, provider)
console.log("<<<====wallet address====>>>", wallet.address)
accountAddress = wallet.address

async function getWalletBalance() {

  balance = await provider.getBalance(accountAddress)
  readableBalance = ethers.utils.formatUnits(balance._hex, "ether")
  console.log("<<<===account balance====>>>", readableBalance)

}


async function tranferCelo() {
  console.log("<<<====transfer celo====>>>");
  // TODO: tx Details here
  const tx = {};
  
  const gasPrice = await wallet.getGasPrice(addressesTest.cusdTokenAddress); // alternative gas fee currencies
  const gasLimit = await wallet.estimateGas(tx);
  // TODO: Investigate more efficient ways to handle this case
  const adjustedGasLimit = gasLimit.mul(10); // Gas estimation doesn't currently work properly for non-CELO currencies   // The gas limit must be padded to increase tx success rate

  const txResponse = await wallet.sendTransaction({
    to: wallet_,
    value: amountIn,
    gasPrice,
    gasLimit: adjustedGasLimit,
    feeCurrency: addressesTest.cusdTokenAddress,
  });

  const txReceipt = await txResponse.wait();
  const balance = await provider.getBalance(accountAddress);
  const balanceAfter = ethers.utils.formatUnits(balance._hex, "ether");
  console.info(`CELO transaction hash received: ${txReceipt.transactionHash}`);
  console.log("<<<===account balance after====>>>", balanceAfter); 
  
  console.log("<<<===end transfer===>>>");
}

const router = new ethers.Contract(
  addressesTest.ubeswapRouter,
  [
    "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint[] memory amounts)",
    "function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint[] memory amounts)",
    "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to,uint256 deadline ) external returns (uint[] memory amounts)",
  ],
  wallet
);

// get the approve for cUSD token
const cUSDContract = new ethers.Contract(
  addressesTest.ubeswapRouter,
    ["function approve(address spender, uint256 amount)"],
    wallet
);

async function getSwapdata() {

  const cUSD = await Fetcher.fetchTokenData(chainId, addressesTest.cusdTokenAddress, provider, "cUSD", "Celo Dollar",18);
  // console.log("<<<===CUSD===>>", cUSD);
  console.log("<<<===celo token addess===>>>", CELO[cUSD.chainId].address);
  // note that you may want/need to handle this async code differently, // for example if top-level await is not an option
  const pair = await Fetcher.fetchPairData(cUSD, CELO[cUSD.chainId], provider);
  // console.log("<<<===pair===>>>", pair);
  console.log("pair_celo_cusd volumeToken0 = ", pair.reserve0.toSignificant(6));
  console.log("pair_celo_cusd volumeToken1 = ", pair.reserve1.toSignificant(6));
  const route = new Route([pair], CELO[cUSD.chainId]);
  // console.log("<<<===route====>>>", route);

  const trade = new Trade( route, new TokenAmount(CELO[cUSD.chainId], amountIn), TradeType.EXACT_INPUT);
  console.log("<<<===Trade===>>>", trade)
  const slippageTolerance = new Percent("0", "10000"); // 0%
  console.log("<<<===slippage===>>>", slippageTolerance)
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw
  const amountOutMinHex = BigNumber.from(amountOutMin.toString()).toHexString()
  console.log("<<<===amount out min===>>>", amountOutMinHex)
  const value = trade.inputAmount.raw;
  const valueHex = BigNumber.from(value.toString()).toHexString()
  console.log("<<<====value=====>>>", valueHex)


  // TODO: tx Details here
  const tx = {};
  
  const gasPrice = await wallet.getGasPrice(addressesTest.cusdTokenAddress); // alternative gas fee currencies
  const gasLimit = await wallet.estimateGas(tx);
  // TODO: Investigate more efficient ways to handle this case
  const adjustedGasLimit = gasLimit.mul(10); // Gas estimation doesn't currently work properly for non-CELO currencies   // The gas limit must be padded to increase tx success rate



  console.log("<<===approve starts here===>>");
  // spender is ubeswap router address 0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121
  const askApprove = await cUSDContract.approve(
    addressesTest.ubeswapRouter,
    amountIn,
    {
      value: "0x0",
      gasPrice,
      gasLimit: adjustedGasLimit,
      // feeCurrency: addresses.cUSDTokenAddress
    }
  );
  console.log("<<===end approved===>>", askApprove);


  console.log("<<===swap starts here===>>");
  const txOje = await router.swapExactTokensForTokens(
    amountIn,
    amountOutMinHex,
    [ addressesTest.celoTokenAddress, addressesTest.TokenAddress1 ],
    to,
    Math.floor(Date.now() / 1000) + 5 * 60,
    {
      value: "0x0",
      gasPrice: ethers.utils.parseUnits('0.02', 'gwei'),
      gasLimit: ethers.utils.parseUnits("0.02", "gwei"),
      // feeCurrency: addresses.cUSDTokenAddress
    })

  console.log("<<<====transaction details====>>>", txOje)
  const receiptTxSwap = await txOje.wait()
  console.log("<====transaction====>",receiptTxSwap.hash)




}


getWalletBalance()
tranferCelo()
getSwapdata()
