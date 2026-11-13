import ImageKit from '@imagekit/nodejs';

let client = null;

// Create the ImageKit client on first use so the API can still start
// (and serve the store) when ImageKit is not configured yet.
const getImageKit = () => {
  if (!client) {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
      throw new Error(
        'IMAGEKIT_PRIVATE_KEY is not set. Add it to server/.env to upload product images.',
      );
    }

    client = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    });
  }

  return client;
};

const imagekit = {
  get files() {
    return getImageKit().files;
  },
};

export default imagekit;
