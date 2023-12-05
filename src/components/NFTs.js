import { Carousel } from 'react-responsive-carousel';

const NFTs = ({ carouselKey, selectedCarouselItem, setSelectedCarouselItem, metadataList, selectImage }) => {
    return (
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
    );
};

export default NFTs;