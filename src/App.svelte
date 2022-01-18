<script lang="ts">
  import { onMount } from "svelte";
  import { ethers } from "ethers";
  import myEpicNft from "./utils/myEpicNft.json";

  import { connectedWallet, connectedContract } from "./stores";

  const CONTRACT_ADDRESS = "0xCc86d17c39734251dd863705103D929448969bFD";
  const COLLECTION_VERSION = "v4";
  const MINT_MAX = 50;

  let ethereum: any;
  let nftsMinted: number = 0;
  let openSeaLink: string = "";
  let isMinting: boolean = false;

  $: nftsRemaining = MINT_MAX - nftsMinted;

  function handleCollectionClick() {
    const collectionUrl = `https://testnets.opensea.io/collection/cartooncatchphrasenft-${COLLECTION_VERSION}`;
    window.open(collectionUrl, "_blank");
  }

  function handleNftClick() {
    window.open(openSeaLink, "_blank");
  }

  async function setConnectedContract() {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      myEpicNft.abi,
      signer
    );
    connectedContract.set(contract);
  }

  async function setupEventListener() {
    // This will essentially "capture" our event when our contract throws it.
    $connectedContract.on("NewEpicNFTMinted", (from: any, tokenId: any) => {
      console.log(from, tokenId.toNumber());
      openSeaLink =
        "https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}";
    });
    console.log("Setup event listener!");
  }

  async function checkChain() {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    // String, hex code of the chainId of the Rinkebey test network
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }
  }

  // NOTE: connects first ethereum account in MetaMask
  async function handleConnectWallet() {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      console.log("Connected ", accounts[0]);
      connectedWallet.set(accounts[0]);
    }
  }

  async function handleMintNft() {
    openSeaLink = "";
    isMinting = true;
    try {
      console.log("Going to pop wallet now to pay gas...");
      let nftTxn = await $connectedContract.makeAnEpicNFT();

      console.log("Mining...please wait.");
      await nftTxn.wait();
    } catch {
      console.log("Gas rejected...");
    }
    isMinting = false;
    console.log(
      `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
    );
  }

  async function getMintCount() {
    let tokensMinted = await $connectedContract.getMintedNftCount();
    nftsMinted = tokensMinted;
  }

  onMount(async () => {
    ethereum = window?.ethereum;
    if (ethereum) {
      await checkChain();
      await handleConnectWallet();
      await setConnectedContract();
      setupEventListener();
      getMintCount();
    } else {
      console.log("Login To Metamask!");
    }
  });
</script>

<svelte:head>
  <title>NFT Frontend</title>
</svelte:head>

<main id="main">
  <button
    type="button"
    class="collection-btn shadow-md"
    on:click={handleCollectionClick}>View Collection on 🌊 OpenSea 🌊</button
  >
  {#if $connectedWallet}
    <div class="mint-nft">
      <h1 class="title">Cartoon Catchphrase</h1>
      <button
        class="button shadow-md"
        disabled={isMinting}
        on:click={handleMintNft}
      >
        {isMinting ? "Minting..." : "Mint your NFT"}
      </button>
      {#if nftsRemaining}
        <div class="remaining-nfts">
          Only {nftsRemaining} left!
        </div>
      {/if}
      {#if openSeaLink}
        <div class="outer-card">
          <div class="card shadow-md">
            <div class="success">Success!</div>
            <div class="open-text">
              We've minted your NFT and sent it to your wallet.
            </div>
            <button
              type="button"
              on:click={handleNftClick}
              class="collection-btn shadow-md"
            >
              🌊 Show my NFT! 🌊
            </button>
            <div class="open-warning">OpenSea can take up to 10 mins.</div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="connect-wallet">
      <h1>Cartoon Catchphrase NFT Collection!</h1>
      <p class="sub-text">
        Each unique. Limited mint: {MINT_MAX} max. First come first served.
      </p>
      <button
        type="button"
        class="button shadow-md"
        on:click={handleConnectWallet}
      >
        Connect Wallet To Get Started
      </button>
    </div>
  {/if}
</main>

<style>
  :root {
    /* text */
    --tx-main: rgb(36, 32, 71);
    --tx-dimmed: rgb(115, 112, 158);
    /* element */
    --el-main: rgb(242, 246, 250);
    --el-shadow: rgb(82, 79, 239);
    --el-highlight: rgb(133, 116, 226);
    /* help */
    --hp-gray: rgb(110, 108, 126);
    --hp-danger: rgb(255, 49, 49);
    --hp-success: rgb(100, 188, 152);
    --hp-pop: rgb(82, 79, 239);
  }

  #main {
    padding-left: 2rem;
    padding-right: 2rem;
    text-align: center;
    margin-top: 1rem;
  }

  .title {
    letter-spacing: 1px;
    font-size: 40px;
    font-family: "Righteous";
    background: #ffb76b;
    background: -webkit-linear-gradient(
      to right,
      #ffb76b 0%,
      #ffa73d 30%,
      #ff7c00 60%,
      #ff7f04 100%
    );
    background: -moz-linear-gradient(
      to right,
      #ffb76b 0%,
      #ffa73d 30%,
      #ff7c00 60%,
      #ff7f04 100%
    );
    background: linear-gradient(
      to right,
      #ffb76b 0%,
      #ffa73d 30%,
      #ff7c00 60%,
      #ff7f04 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .sub-text {
    color: var(--el-main);
    font-size: 24px;
  }

  .remaining-nfts {
    letter-spacing: 1px;
    font-family: "Righteous";
    background: #ffb76b;
    background: -webkit-linear-gradient(
      to right,
      #ffb76b 0%,
      #ffa73d 30%,
      #ff7c00 60%,
      #ff7f04 100%
    );
    background: -moz-linear-gradient(
      to right,
      #ffb76b 0%,
      #ffa73d 30%,
      #ff7c00 60%,
      #ff7f04 100%
    );
    background: linear-gradient(
      to right,
      #ffb76b 0%,
      #ffa73d 30%,
      #ff7c00 60%,
      #ff7f04 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 24px;
    font-weight: 600;
    margin-top: 1rem;
  }

  .success {
    color: var(--hp-pop);
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .open-text {
    color: var(--hp-pop);
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .open-warning {
    margin-top: 1rem;
    color: white;
    font-size: 14px;
    font-weight: 500;
    font-style: italic;
  }

  .collection-btn {
    display: inline-block;
    border: 0;
    border-radius: 1rem;
    padding: 0.5rem 1rem;
    margin: 0 0.2rem 0.2rem 0;
    box-sizing: border-box;
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 600;
    color: #ffffff;
    background-color: var(--hp-pop);
    text-align: center;
    position: relative;
  }
</style>
