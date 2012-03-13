
/*
 * GET home page.
 */
exports.index = function(req, res){
  res.render('index.ejs')
};

/*
 * Affiche le formulaire 
 */
exports.initFileUpload = function(req, res){
  res.render('file-upload.ejs')
};
			
