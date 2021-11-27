const { ChainId, Token, WETH, Fetcher, Route, Trade, TokenAmount, TradeType, Percent  }= require("@uniswap/sdk");
const { ethers, Wallet, BigNumber, getDefaultProvider } = require("ethers")

// console.log(`The chainId of mainnet is ${ ChainId.MAINNET }.`);
const provider = getDefaultProvider('mainnet')
const chainId = ChainId.MAINNET;

// Wallet / connection details
const Seed = ''  // enter your wallet 12 word seed phrase
const to = "0xc8739959E413365255d82d86e6db157768B6DEAD"; // should be a checksummed recipient address // enter your wallet address where to send the bought tokens

const wallet = new Wallet(Seed)
const account = wallet.connect(provider)

const tokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F" // must be checksummedconst decimals = 18;
// const tokenAddress = "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea"
const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
async function getSwapdata() {

const DAI = await Fetcher.fetchTokenData(chainId, tokenAddress, provider);
console.log("<=====DAI=====>", DAI)

// note that you may want/need to handle this async code differently,
// for example if top-level await is not an option
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId], provider);
console.log("<<===pair===>", pair)
const route = new Route([pair], WETH[DAI.chainId]);
console.log("<<<===Route====>>>", route)

// console.log(route.midPrice.toSignificant(6)); // 201.306
// console.log(route.midPrice.invert().toSignificant(6)); // 0.00496756

const amountIn = "1000000000000000000"; // 1 WETH
const trade = new Trade(  route,  new TokenAmount(WETH[DAI.chainId], amountIn),  TradeType.EXACT_INPUT);
console.log("<====trade===>", trade)

const slippageTolerance = new Percent("50", "10000"); // 50 bips, or 0.50%

const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw; // needs to be converted to e.g. hex
const amountOutMinHex = BigNumber.from(amountOutMin.toString()).toHexString();

const path = [WETH[DAI.chainId].address, DAI.address];

const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current Unix time
const value = trade.inputAmount.raw; // needs to be converted to e.g. hex
const inputAmountHex = BigNumber.from(value.toString()).toHexString(); 
// const amountInHex = ethers.BigNumber.from(value.toString()).toHexString()
const gasLimit  = await provider.estimateGas()

const router = new ethers.Contract(
    routerAddress,  
    [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    account
    )
  
  const amounts = await router.getAmountsOut(amountIn, [pair])  
  console.log("-----", amounts)  
  console.log('<<===Variable for Swap===>>', { path, to, deadline, value, inputAmountHex })

  const tx = await router.swapExactTokensForTokens(
        amountOutMinHex,
        path,
        to,
        deadline,
        {value: inputAmountHex, gasPrice: ethers.utils.parseUnits('20', 'gwei'), gasLimit: gasLimit}
    )

    const receipt = await tx.wait()
    console.log("<====transaction====>",receipt)
}

getSwapdata()