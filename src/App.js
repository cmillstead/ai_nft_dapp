import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import Spinner from 'react-bootstrap/Spinner';
import Navigation from './components/Navigation';
import Select from 'react-select';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import NFT from './abis/NFT.json';
import config from './config.json';
import { toHttpUrl } from './utilities';
import { styles } from './styles';

function App() {
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
  const [nftData, setNftData] = useState({
    provider: null,
    account: null,
    nft: null,
    url: null
  });


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

  const createImage = async (seed) => {
    setMessage("Generating Images...");
    try {
      const response = await axios.post('http://localhost:3001/api/huggingface/create', {
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


  const uploadImage = async (imageData) => {
    setMessage('Uploading image to IPFS...');
    try {
      const response = await axios.post('http://localhost:3001/api/huggingface/upload', {
        name,
        description,
        image: imageData,
      });
      const url = response.data.url;
      setURL(url);
      console.log('Metadata URI: ', url);
      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsError(true);
    }
  };


  const fetchMetadataAndSetImage = async (tokenURI) => {
    let metadataUrl = toHttpUrl(tokenURI);
    const metadataResponse = await fetch(metadataUrl);
    const metadata = await metadataResponse.json();
    const imageUrl = metadata.image;

    let httpImageUrl = toHttpUrl(imageUrl);
    setMetadataList(prevMetadataList => [...prevMetadataList, { image: httpImageUrl }]);
    setLastMintedImage(httpImageUrl);
    setSelectedCarouselItem(metadataList.length);
  };


  const mintImage = async (tokenURI) => {
    setMessage("Waiting for Mint...");

    const signer = await provider.getSigner();
    const transaction = await nft.connect(signer).mint(tokenURI, { value: ethers.utils.parseEther('1') });
    await transaction.wait();

    setImage(null);
    setSelectedImageIndex("");
    fetchMetadataAndSetImage(tokenURI);
  };


  const selectImage = (selectedImage, index) => {
    setImage(selectedImage);
    setSelectedImageIndex(index);
  };


  const regenerateImages = () => {
    resetForm();
    createImages();
  };


  const resetForm = () => {
    setImage(null);
    setURL(null);
    setImages([]);
    setImagesCreated(false);
    setSelectedImageIndex("");
  };


  const styleOptions = useMemo(() => styles.map(style => ({
    value: style.id,
    label: style.name
  })), []);


  const selectStyleHandler = useCallback((selectedOption) => {
    setNftData(prevState => ({ ...prevState, selectedStyle: selectedOption.value }));
    setSelectedStyle(selectedOption.value);
  }, []);


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



  useEffect(() => {
    setCarouselKey(prevKey => prevKey + 1);
  }, [metadataList]);


  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <div className='form'>
        <form>
        <textarea
            cols='36'
            rows='2'
            placeholder='Enter prompt...'
            onChange={(e) => {
              setDescription(e.target.value)}
            }
          />
          <input
            type='text'
            placeholder='Enter NFT name...'
            onChange={(e) => {
              setName(e.target.value)}
            }
          />
          <div className="select-container">
            <Select
              options={styleOptions}
              placeholder='Select style...'
              value={styleOptions.find(style => style.value === selectedStyle)}
              onChange={selectStyleHandler}
            />
          </div>

          {imagesCreated ? (
            <button
              onClick={regenerateImages}
              className='ui'>
              Regenerate Images
            </button>
          ) : (
            <div>
              {isWaiting ? (
                <div className='text-center spinner'>
                  <Spinner
                    animation='border'
                    style={{ display: 'block', margin: '0 auto', color: 'white' }}
                  />
                </div>
              ) : (
                <button
                  onClick={createImages}
                  className='ui'>
                  Generate Images
                </button>
              )}
            </div>
          )}

          {images.length === 0 ? (
            null
          ) : (
            image !== null ? (
              <button
                  onClick={submitHandler}
                  className='ui'>
                  Mint Selected Image Into NFT
              </button>
            ) : (
              <div className='mint-message'>
                Please select an image to mint.
                <FontAwesomeIcon icon={faArrowRight} />
              </div>
            )
          )}

        </form>

        <div className="image-container">
          <div>
            {!isWaiting && images.length ? (
            <div className='image-grid'>
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => selectImage(img, index)}>
                  <img
                    key={index}
                    src={img}
                    alt={`AI generated ${index}`}
                    style={{width: '256px', height: '256px'}}
                    className={selectedImageIndex.toString() === index.toString() ? 'selected-image' : ''}
                  />
                </button>
              ))}
            </div>
          ) : isWaiting ? (
            <div className="image-placeholder">
              <Spinner animation="border" />
              <p className="message">{message}</p>
            </div>
          ) : (
            null
          )}
            </div>
        </div>
      </div>

      <div style={{ width: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
        <Carousel
          key={carouselKey}
          selectedItem={selectedCarouselItem}
          showArrows={true}
          infiniteLoop={true}
          showThumbs={false}
          onChange={(index) => setSelectedCarouselItem(index)}>
          {metadataList.map((metadata, index) => (
            <div key={index}>
              <img
                src={metadata.image}
                alt={`NFT ${index}`}
                style={{ width: '500px', height: '500px' }}
                onClick={() => selectImage(metadata.image, index)} />
            </div>
          ))}
        </Carousel>
      </div>



      {!isWaiting && url && (
        <p>
          View&nbsp;<a href={url} target="_blank" rel="noreferrer">Metadata</a>
        </p>
      )}
      { isError ? <p>Something went wrong. Please try again.</p> : null }

    </div>
  );
};

export default App;