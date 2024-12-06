const mongoose = require('mongoose');

const ConnectDb = async () => {
  try {
    await mongoose.connect("mongodb+srv://admin:Admin%401234@cluster0.zbool.mongodb.net/eCommerce?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1); // Exit process on failure
  }
};

module.exports = ConnectDb;