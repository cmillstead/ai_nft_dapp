const MetadataLink = ({ metadataUrl, isWaiting, isError }) => {
    return (
        <div>
        {!isWaiting && metadataUrl && (
          <p>
            View&nbsp;<a href={metadataUrl} target="_blank" rel="noreferrer">Metadata</a>
          </p>
        )}
        { isError ? <p>Something went wrong. Please try again.</p> : null }
      </div>
    );
};

export default MetadataLink;