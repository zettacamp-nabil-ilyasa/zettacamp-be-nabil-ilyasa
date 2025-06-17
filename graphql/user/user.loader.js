//*************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');

//*************** IMPORT MODULE ***************
const User = require('./user.model.js');

/**
 * Batch function to load users by array of user IDs
 * @param {Array<string>} userIds - Array of user IDs
 * @returns
 */
async function BatchUsers(userIds) {
  try {
    const users = await User.find({ _id: { $in: userIds }, status: { $ne: 'deleted' } }).lean();
    const dataMap = new Map();
    users.forEach((user) => {
      dataMap.set(user._id.toString(), user);
    });
    return userIds.map((userId) => dataMap.get(userId.toString()));
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Create a new DataLoader instance for batching users by user IDs
 * @returns {DataLoader<string, Object|null>} A DataLoader instance that loads users by user ID
 */
function UserLoader() {
  return new DataLoader(BatchUsers);
}

//*************** EXPORT MODULE ***************
module.exports = {
  UserLoader,
};
