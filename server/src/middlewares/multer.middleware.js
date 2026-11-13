import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Only JPEG, PNG, and WEBP images are allowed.');
    error.isUploadValidationError = true;

    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },

  fileFilter,
});

export default upload;
