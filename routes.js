//TODO: edit post image working???

let then = require('express-then')
let multiparty = require('multiparty')
let DataUri = require('datauri')
let fs = require('fs')
let isLoggedIn = require('./middleware/isLoggedIn')
let Post = require('./model/post')
let User = require('./model/user')
let Comment = require('./model/comment')

require('songbird')

module.exports = (app) => {
  let passport = app.passport

  app.get('/', (req, res) => {
    res.render('login.ejs')
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {
      message: req.flash('error')
    })
  })

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.get('/signup', (req, res) => {
    res.render('signup.ejs', {
      message: req.flash('error')
    })
  })

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/post/:postId?', then(async(req, res) => {
    let postId = req.params.postId
    if (!postId) {
      res.render('post.ejs', {
        post: {},
        verb: 'Create'
      })
      return
    }

    let post = await Post.promise.findById(postId)
    // console.log(post)
    if (!post) res.send(404, 'Post Not Found')
    let dataUri = new DataUri

    let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
    res.render('post.ejs', {
      post: post,
      verb: 'Edit',
      image: `data:${post.image.contentType};base64,${image.base64}`
    })
  }))

  app.post('/post/:postId?', isLoggedIn, then(async(req, res) => {
    let postId = req.params.postId
 
    // CREATE
    if (!postId) {
      let post = new Post()
      let [{
        title: [title],
        content: [content]
      }, {
        image: [file]
      }] = await new multiparty.Form().promise.parse(req)

      post.title = title
      post.content = content
      post.created = new Date().toLocaleString()
      post.userId = req.user._id
      post.image.data = await fs.promise.readFile(file.path)
      post.image.contentType = file.headers['content-type']
      await post.save()
      res.redirect('/blog/' + encodeURI(req.user.blogTitle))
      return
    }

    // EDIT
    let post = await Post.promise.findById(postId)
    if (!post) res.send(404, 'Post Not Found')

    // UPDATE
    let [{
      title: [title],
      content: [content]
    }, {
      image: [file]
    }] = await new multiparty.Form().promise.parse(req)
    post.title = title
    post.content = content
    post.updated = new Date().toLocaleString()
    await post.save()
    res.redirect('/blog/' + encodeURI(req.user.blogTitle))
    return
  }))

  app.get('/blog/:blogId?', then(async(req, res) => {
    let blogId = req.params.blogId
    if (blogId) {
      let user = await User.promise.findOne({
        blogTitle: blogId
      })

      let posts = await Post.promise.find({
        userId: user._id
      })

      var comments = []
      for (var i=0; i<posts.length; i++) {
        let comment = await Comment.find({postId: posts[i]._id})   
        if (comment.length > 0) comments.push(comment)

        let dataUri = new DataUri
        var image = dataUri.format('.' + posts[i].image.contentType.split('/').pop(), posts[i].image.data)
        posts[i].image2 = `data:${posts[i].image.contentType};base64,${image.base64}`
        console.log(posts[i].image)
      }

      res.render('blog.ejs', {
        comments: comments,
        user: user,
        posts: posts,
        message: req.flash('error')
      })
    }
  }))

  app.post('/comment/:postId?', isLoggedIn, then(async(req, res) => {
      let postId = req.params.postId
      if (postId) {
        let commentMessage = new Comment()
        let [{comment: [comment]}] = await new multiparty.Form().promise.parse(req)

        let commentUser = await User.promise.findById(req.user._id)
        commentMessage.userId = req.user._id
        commentMessage.username = commentUser.username
        commentMessage.content = comment
        commentMessage.created = new Date().toLocaleString()
        commentMessage.postId = postId
        await commentMessage.save()

        // if user id = userid of post, redirect to profile, else redirect to same blog page
        let post = await Post.promise.findOne({
          _id:postId
        })
        if (post.userId == req.user._id) {
          res.redirect('/profile')
        } else {
          let postUser = await User.promise.findOne({
            _id:post.userId
          })
          res.redirect('/blog/' + postUser.blogTitle)
        }
      }
  }))

  app.get('/delete/:deleteId?', isLoggedIn, then(async(req, res) => {
    // TODO: is this the correct user?
    let deleteId = req.params.deleteId
    Post.findOne({
      _id: deleteId
    }).remove().exec();
    // TODO: only redirect if successful 
    res.redirect('/profile')
  }))

  app.get('/profile', isLoggedIn, then(async(req, res) => {
    let posts = await Post.promise.find({
      userId: req.user._id
    })

    var comments = []
    for (var i=0; i<posts.length; i++) {
      let comment = await Comment.find({postId: posts[i]._id})   
      if (comment.length > 0) comments.push(comment)
    }
    
    res.render('profile.ejs', {
      comments: comments,
      user: req.user,
      posts: posts,
      message: req.flash('error')
    })
  }))

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })
}