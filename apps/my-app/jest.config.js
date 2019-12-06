module.exports = {
  name: 'my-app',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/my-app',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
