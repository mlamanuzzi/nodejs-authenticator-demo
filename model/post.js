let mongoose = require('mongoose')
require('songbird')

let PostSchema = mongoose.Schema({
  title: {type: String, required: true},
  content: {type: String, required: true},
  userId: {type:String, required: true},
  created: {type: String, required: true},
  updated: {type: String, required: false},
  image: {
    data: Buffer,
    contentType: String
  }

})

module.exports = mongoose.model('Post', PostSchema)
