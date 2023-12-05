import { Spinner } from 'react-bootstrap';

const Images = ({ isWaiting, images, selectImage, selectedImageIndex, message }) => {
    return (
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
    );
};

export default Images;
