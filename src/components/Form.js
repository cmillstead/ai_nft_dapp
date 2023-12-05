import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import Spinner from 'react-bootstrap/Spinner';

const Form = ({
    setDescription,
    setName,
    styleOptions,
    selectedStyle,
    selectStyleHandler,
    imagesCreated,
    regenerateImages,
    isWaiting,
    createImages,
    images,
    image,
    submitHandler,
    faArrowRight }) => {
    return (
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
    );
};

export default Form;