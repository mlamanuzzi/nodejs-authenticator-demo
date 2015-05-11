let mongoose = require('mongoose')
require('songbird')

let BlogSchema = mongoose.Schema({
  userid: {type: String, required: true},
  
})

module.exports = mongoose.model('Blog', BlogSchema)
