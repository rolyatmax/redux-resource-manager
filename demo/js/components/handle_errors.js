import React from 'react';


function HandleErrors({ requests }) {
  const rejected = requests.filter(r => r.status === 'rejected');

  if (!rejected.length) return null;

  function onClickButton(e) {
    e.preventDefault();
    rejected.forEach(r => r.retry());
  }

  return (
    <button onClick={onClickButton}>Retry requests</button>
  );
}

HandleErrors.propTypes = {
  requests: React.PropTypes.array.isRequired,
};

export default HandleErrors;
