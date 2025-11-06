module.exports = {
  preset: 'jest-expo', // Hoặc 'react-native' nếu không dùng Expo
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  // Thêm dòng này để Jest biết cách xử lý các module của React Native
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*)',
  ],
};
