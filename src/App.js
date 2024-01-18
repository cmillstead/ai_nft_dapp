import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import Navigation from './components/Navigation';
import Form from './components/Form';
import Images from './components/Images';
import NFTs from './components/NFTs';
import MetadataLink from './components/MetadataLink';
import "react-responsive-carousel/lib/styles/carousel.min.css";

import NFT from './abis/NFT.json';
import config from './config.json';
import { toHttpUrl } from './utilities';
import { styles } from './styles';

function App() {
  // State variables to manage app data and UI states
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [image, setImage] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [nft, setNFT] = useState(null);
  const [url, setURL] = useState(null);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState("");
  const [imagesCreated, setImagesCreated] = useState(false);
  const [metadataList, setMetadataList] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [lastMintedImage, setLastMintedImage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [carouselKey, setCarouselKey] = useState(0);
  const [selectedCarouselItem, setSelectedCarouselItem] = useState(0);
  const [metadataUrl, setMetadataUrl] = useState(null);
  const [nftData, setNftData] = useState({
    provider: null,
    account: null,
    nft: null,
    url: null
  });

  // handles the submission of NFT minting
  const submitHandler = async (e) => {
    e.preventDefault();

    if (name === "" || description === "") {
      window.alert("Please provide a name and a description.");
      return;
    }
    setIsWaiting(true);

    const url = await uploadImage(image);

    // mint NFT
    await mintImage(url);

    setIsWaiting(false);
    setMessage("");
  };

  // function to generate images using an AI model
  const createImage = async (seed) => {
    setMessage("Generating Images...");
    try {
      const response = await axios.post('https://ai-nft-api.vercel.app/api/create/', {
        inputs: `${description} [Style: ${selectedStyle}]`,
        options: {
          samples: "4",
          wait_for_model: true,
          seed: seed
        }
      });

      return response.data.image;
    } catch (error) {
      console.log(error);
      setIsError(true);
    }
  }

  // function to handle multiple image creation
  const createImages = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (name === "" || description === "") {
      window.alert("Please provide a name and a description.");
      return;
    }
    setIsWaiting(true);

    const promises = Array.from({ length: 4 }, (_, i) => {
      const randomSeed = Math.floor(Math.random() * 100000);
      return createImage(randomSeed);
    });

    const imageList = await Promise.all(promises);
    setImages(imageList);
    setImagesCreated(true);
    setIsWaiting(false);
    return imageList;
  };

  // function to upload the image to IPFS
  const uploadImage = async (imageData) => {
    setMessage('Uploading image to IPFS...');
    try {
      const response = await axios.post('https://ai-nft-api.vercel.app/api/upload/', {
        name,
        description,
        image: imageData,
      });
      const url = response.data.url;
      setURL(url);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsError(true);
    }
  };

  // fetches metadata for a given token URI and updates state
  const fetchMetadataAndSetImage = async (tokenURI) => {
    try {
      let metadataUrl = toHttpUrl(tokenURI);
      setMetadataUrl(metadataUrl);
      const metadataResponse = await fetch(metadataUrl);
      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch metadata');
      }
      const metadata = await metadataResponse.json();
      const imageUrl = metadata.image;
      let httpImageUrl = toHttpUrl(imageUrl);

      setMetadataList(prevMetadataList => [...prevMetadataList, { image: httpImageUrl }]);
      setLastMintedImage(httpImageUrl);
      setSelectedCarouselItem(metadataList.length);
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  // function to mint an image as an NFT
  const mintImage = async (tokenURI) => {
    setMessage("Waiting for Mint...");
    const signer = await provider.getSigner();
    const transaction = await nft.connect(signer).mint(tokenURI, { value: nft.cost() });
    await transaction.wait();

    setImage(null);
    setSelectedImageIndex("");
    fetchMetadataAndSetImage(tokenURI);
  };

  // handles the selection of an image from the generated list
  const selectImage = (selectedImage, index) => {
    setImage(selectedImage);
    setSelectedImageIndex(index);
  };

  // regenerates images based on the user input
  const regenerateImages = () => {
    resetForm();
    createImages();
  };

  // resets the form to its initial state
  const resetForm = () => {
    setImage(null);
    setURL(null);
    setImages([]);
    setImagesCreated(false);
    setSelectedImageIndex("");
  };

  // prepares style options for the select component
  const styleOptions = useMemo(() => styles.map(style => ({
    value: style.id,
    label: style.name
  })), []);

  // handler for style selection changes
  const selectStyleHandler = useCallback((selectedOption) => {
    setNftData(prevState => ({ ...prevState, selectedStyle: selectedOption.value }));
    setSelectedStyle(selectedOption.value);
  }, []);

  // loads blockchain data when the component mounts
  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        const network = await provider.getNetwork();
        const nft = new ethers.Contract(config[network.chainId].nft.address, NFT, provider);
        setNFT(nft);
      } catch (error) {
        console.error(`loadBlockchainData: ${error}`);
      }
    };

    loadBlockchainData();
  }, []);

  // fetches owned NFTs when nft or account state changes
  useEffect(() => {
    if (nft && account) {
      const fetchOwnedNFTs = async () => {
        const tokenIds = await nft.getTokensOfOwner(account);

        const metadataUris = await Promise.all(
          tokenIds.map(async (tokenId) => {
            return await nft.tokenURI(tokenId);
          })
        );

        const metadataList = await Promise.all(
          metadataUris.map(async (uri) => {
            // Convert the URI to an HTTP URL
            let fetchUri = toHttpUrl(uri);

            // Fetch the metadata
            const response = await fetch(fetchUri);
            if (!response.ok) {
              console.error("Fetch failed:", await response.text());
              return null;
            }
            const metadata = await response.json();

            // Convert the image URI to HTTP URL
            metadata.image = toHttpUrl(metadata.image);

            return metadata;
          })
        );

        setMetadataList(metadataList);
      };

      fetchOwnedNFTs();
    }
  }, [nft, account]);


  // updates the carousel key to trigger a re-render when metadataList changes
  useEffect(() => {
    setCarouselKey(prevKey => prevKey + 1);
  }, [metadataList]);


  return (
    <div>
      <Navigation
        account={account}
        setAccount={setAccount} />

      <div className='form'>
        <Form
          setDescription={setDescription}
          setName={setName}
          styleOptions={styleOptions}
          selectedStyle={selectedStyle}
          selectStyleHandler={selectStyleHandler}
          imagesCreated={imagesCreated}
          regenerateImages={regenerateImages}
          isWaiting={isWaiting}
          createImages={createImages}
          images={images}
          image={image}
          submitHandler={submitHandler}
        />

        <Images
          isWaiting={isWaiting}
          images={images}
          selectImage={selectImage}
          selectedImageIndex={selectedImageIndex}
          message={message}
        />
      </div>

      <NFTs
        carouselKey={carouselKey}
        selectedCarouselItem={selectedCarouselItem}
        setSelectedCarouselItem={setSelectedCarouselItem}
        metadataList={metadataList}
        selectImage={selectImage}
      />

      <MetadataLink
        metadataUrl={metadataUrl}
        isWaiting={isWaiting}
        isError={isError}
      />

    </div>
  );
};

export default App;
