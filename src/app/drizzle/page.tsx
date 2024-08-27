import React from 'react';

export default function DrizzlePage() {
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className='flex h-[90vh] w-full items-center justify-center'>
        <iframe
          src='https://local.drizzle.studio'
          className='h-full w-full border-0'
          title='Drizzle Local'
          allow='fullscreen'
        />
      </div>
    );
  }

  return <>Drizzle studio is only available in development mode</>;
}
