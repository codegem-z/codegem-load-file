import loadFile from '../src/mod.js';

loadFile('./example/source')().then((res) => {
  console.log(
    '%c res',
    'color:white;background: rgb(83,143,204);padding:4px',
    res,
  );
});
