export const toHttpUrl = (ipfsUrl) => {
    return ipfsUrl.startsWith("ipfs://")
      ? `https://ipfs.io/ipfs/${ipfsUrl.split("ipfs://")[1]}`
      : ipfsUrl;
};

