const { ChainId, Token, Fetcher, CELO, Route, Trade, TokenAmount, TradeType,Percent,} = require("@ubeswap/sdk")
const { CeloProvider, CeloWallet } = require("@celo-tools/celo-ethers-wrapper")
const { ethers, Wallet, BigNumber, providers } = require("ethers")

// contract addresses
const { addressesMain, addressesTest  }= require('./utils.js')

// connecting to mainnet
// const provider = new CeloProvider('https://forno.celo.org')
const provider = new CeloProvider("https://alfajores-forno.celo-testnet.org")

// const chainId = ChainId.MAINNET
const chainId = ChainId.ALFAJORES
console.log("chainId is...", chainId)

// wallet connection details
const seed = ""; // ''  // enter your wallet 12 word seed phrase
const mywallet = "0x909b0dfe4267f7e2037807a71a9e06eca8ea23dc";
const to = "0xc8739959E413365255d82d86e6db157768B6DEAD"; // '0x8bf0AfCa4e54D8F4d46FA3F734Aaf1c1A10c6AD0'// should be a checksummed recipient address // enter your wallet address where to send the bought tokens

const amount = ethers.utils.parseUnits("1.2", "ether"); // equivalent to ~$0.20 USD
// const wallet = new Wallet(Seed)
// const account = wallet.connect(provider)
const wallet = new CeloWallet(seed, provider);
console.log("<<<====wallet address====>>>", wallet.address);
accountAddress = wallet.address;

async function getWalletBalance() {
  const balance = await provider.getBalance(accountAddress);
  const readableBalance = ethers.utils.formatUnits(balance._hex, "ether");
  console.log("<<<===account balance====>>>", readableBalance);
}

console.log("<<<====transfer celo====>>>");
async function tranferCelo() {
  // TODO: tx Details here
const tx = {};

const gasPrice = await wallet.getGasPrice(addressesTest.cusdTokenAddress); // alternative gas fee currencies
const gasLimit = await wallet.estimateGas(tx);
// TODO: Investigate more efficient ways to handle this case
const adjustedGasLimit = gasLimit.mul(10); // Gas estimation doesn't currently work properly for non-CELO currencies   // The gas limit must be padded to increase tx success rate

  const txResponse = await wallet.sendTransaction({
    to: mywallet,
    value: amount,
    gasPrice,
    gasLimit: adjustedGasLimit,
    feeCurrency: addressesTest.cusdTokenAddress,
  });

  const txReceipt = await txResponse.wait();
  const balance = await provider.getBalance(accountAddress);
  const balanceAfter = ethers.utils.formatUnits(balance._hex, "ether");
  console.info(`CELO transaction hash received: ${txReceipt.transactionHash}`);
  console.log("<<<===account balance after====>>>", balanceAfter);  
}
console.log("<<<===end transfer===>>>");





async function getSwapdata() {
  // TestNet
  // const Token1 = await Fetcher.fetchTokenData(chainId, TokenAddress.TokenAddress1, provider, "TOKEN-1", "TKN-1" , 18 )
  // console.log("<<<===Token1===", Token1)
  // const Token2 = await Fetcher.fetchTokenData(chainId, TokenAddress.TokenAddress2, provider, "TOKEN-2", "TKN-2" , 18 )
  // console.log("<<<===Token-2===", Token2)
  // const pair = await Fetcher.fetchPairData(Token1, Token2, provider)

  // MainNet Data
  const cUSD = await Fetcher.fetchTokenData(chainId, addresses.cUSDTokenAddress,
    provider,
    "cUSD",
    "Celo Dollar",
    18
  );
  console.log("<<<===CUSD===>>", cUSD);
  console.log("<<<===celo token addess===>>>", CELO[cUSD.chainId].address);

  // note that you may want/need to handle this async code differently,
  // for example if top-level await is not an option
  const pair = await Fetcher.fetchPairData(cUSD, CELO[cUSD.chainId], provider);
  console.log("<<<===pair===>>>", pair);
  console.log("pair_celo_ube volumeToken0 = ", pair.reserve0.toSignificant(6));
  console.log("pair_celo_ube volumeToken1 = ", pair.reserve1.toSignificant(6));
  const route = new Route([pair], CELO[cUSD.chainId]);
  console.log("<<<===route====>>>", route);
  console.log("<<<===decimals===>>>", route.path[0].decimals);

  // const amount = "1000000000000000"; // 1 CELO convert amountIn.toString()
  const amountIn = ethers.utils.parseUnits("0.02", "ether"); // equivalent to ~$0.20 USD
  // const amountIn1 = amountIn.toBigInt()
  console.log("<<<===amount in===>>>", amountIn);
  // console.log("<<<===amount in===>>>", amountIn1)

  const trade = new Trade( route, new TokenAmount(CELO[cUSD.chainId], amountIn), TradeType.EXACT_INPUT);

  const slippageTolerance = new Percent("50", "10000"); // 0%
  // console.log("<<<===slippage===>>>", slippageTolerance)
  // const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw  // needs to be converted to e.g. hex
  // const amountOutMinHex = amountOutMin.toString() // BigNumber.from(amountOutMin.toString()).toHexString()
  // console.log("<<<===amount out min===>>>", amountOutMin)
  // console.log("<<<===amount out min hex===>>>", amountOutMinHex)

  const path = [CELO[cUSD.chainId].address, cUSD.address]; //  path with 2 addresses
  // const poolsPath = await Fetcher.fetchPairAddresses( CELO[UBE.chainId].address, UBE.address, addresses.ubeswapFactory, provider ) // get related pools adresses array for this pair of tokens
  const deadline = Math.floor(Date.now() / 1000) + 5 * 60; // 4698550252277123   // Math.floor(Date.now() / 1000) + 60 * 40 // 20 minutes from the current Unix time
  // const value = trade.inputAmount.raw     // needs to be converted to e.g. hex
  // const inputAmountHex = value.toString() // BigNumber.from(value.toString()).toHexString()

  console.log("<<<===variable for swap===>>>", { path, to, deadline });

  const router = new ethers.Contract(
    addresses.ubeswapRouter,
    [
      "function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
      "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint[] memory amounts)",
      "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to,uint256 deadline ) external returns (uint[] memory amounts)",
    ],
    wallet
  );

  const amountOut = await router.getAmountsOut(amountIn, path);
  const amountOutMin = amountOut[1].toString(); // 4698550252277123
  console.log("<<<===amount out===>>>", amountOutMin);

  // get the approve for cUSD token
  const cUSDContract = new ethers.Contract(
    CELO[cUSD.chainId].address,
    ["function approve(address spender, uint256 amount)"],
    wallet
  );

  console.log("------celo ethers wrappers----");

  console.log("<<===approve starts here===>>");
  // spender is ubeswap router address 0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121
  const askApprove = await cUSDContract.approve(
    addresses.ubeswapRouter,
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
  // const txOje = await router.swapExactTokensForTokens(
  //   amountIn,
  //   amountOutMin,
  //   path,
  //   to,
  //   deadline,
  //   {
  //     value: "0x0",
  //     gasPrice: ethers.utils.parseUnits('0.02', 'gwei'),
  //     gasLimit: ethers.utils.parseUnits("0.02", "gwei"),
  //     // feeCurrency: addresses.cUSDTokenAddress
  //   }).send({ from: to})

  // console.log("<<<====transaction details====>>>", txOje)
  // const receiptTxSwap = await txOje.wait()
  // console.log("<====transaction====>",receiptTxSwap)
}

// default export later
getWalletBalance();
tranferCelo();
// getSwapdata()
