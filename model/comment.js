let mongoose = require('mongoose')
// require('songbird')

let CommentSchema = mongoose.Schema({
  postId: {type: String, required: true},
  content: {type: String, required: true},
  userId: {type:String, required: true},
  username: {type: String, required: true},
  created: {type: String, required: true},
})

module.exports = mongoose.model('Comment', CommentSchema)
 