import React from 'react';
import { usePublicData } from '../../../platform/hooks';

export default () => {
  const { get, set } = usePublicData();
  const title = get('title');

  return (
    <div>
      <h2>Set Title</h2>
      <input
        type="text"
        value={title}
        onChange={event => set('title', event.target.value)}
      />
    </div>
  );
};