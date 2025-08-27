// eslint-disable-next-line
const fs = require('fs');

// eslint-disable-next-line
const buildMeta = require('../.next/build-manifest.temp.json');

const resetManifest = () => {
  if (!buildMeta) {
    return;
  }
  const rawData = JSON.stringify(buildMeta, null, '\t');


  fs.writeFileSync('.next/build-manifest.json', rawData);

  fs.unlinkSync('.next/build-manifest.temp.json');
};

resetManifest();
