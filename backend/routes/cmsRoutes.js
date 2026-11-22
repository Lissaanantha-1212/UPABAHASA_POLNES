const express = require('express');
const router = express.Router();

const cmsController = require('../controllers/cmsController');
const {
    authenticateToken,
    authorizeAdmin
} = require('../middleware/authMiddleware');

const {
    uploadCmsImage,
    verifyCmsImage
} = require('../middleware/uploadCmsImage');

const adminOnly = [authenticateToken, authorizeAdmin];

const requireFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Gambar wajib diunggah.'
        });
    }

    next();
};

const registerCrudRoutes = (
    endpoint,
    crud,
    fileField = null,
    requiredFile = false
) => {
    const collectionRoute = router.route(`/admin/${endpoint}`);

    collectionRoute.get(...adminOnly, crud.selectAll);

    if (fileField) {
        const createMiddleware = [
            ...adminOnly,
            uploadCmsImage.single(fileField),
            verifyCmsImage
        ];

        if (requiredFile) {
            createMiddleware.push(requireFile);
        }

        collectionRoute.post(...createMiddleware, crud.create);
    } else {
        collectionRoute.post(...adminOnly, crud.create);
    }

    const itemRoute = router.route(`/admin/${endpoint}/:id`);

    itemRoute.get(...adminOnly, crud.selectOne);

    if (fileField) {
        itemRoute.put(
            ...adminOnly,
            uploadCmsImage.single(fileField),
            verifyCmsImage,
            crud.update
        );
    } else {
        itemRoute.put(...adminOnly, crud.update);
    }

    itemRoute.delete(...adminOnly, crud.remove);
};

// Public
router.get('/home', cmsController.getHomeContent);
router.get('/about', cmsController.getAboutContent);
router.get('/posts', cmsController.getPublicPosts);
router.get('/posts/:slug', cmsController.getPublicPostBySlug);
router.get('/faqs', cmsController.getPublicFaqs);
router.get('/galleries', cmsController.getPublicGalleries);

// Site settings
router.get(
    '/admin/site-settings',
    ...adminOnly,
    cmsController.getSiteSettings
);

router.put(
    '/admin/site-settings',
    ...adminOnly,
    cmsController.saveSiteSetting
);

// Upload foto profil Beranda dan Tentang
router.put(
    '/admin/profile-image',
    ...adminOnly,
    uploadCmsImage.single('image'),
    verifyCmsImage,
    cmsController.uploadProfileImage
);

router.put(
    '/admin/about-profile-image',
    ...adminOnly,
    uploadCmsImage.single('image'),
    verifyCmsImage,
    cmsController.uploadAboutProfileImage
);

// Publish / Unpublish berita dan pengumuman
router.patch(
    '/admin/posts/:id/status',
    ...adminOnly,
    cmsController.updatePostStatus
);

// CMS CRUD
registerCrudRoutes('posts', cmsController.postsCrud, 'image');
registerCrudRoutes('faqs', cmsController.faqsCrud);
// Galeri memakai handler khusus agar proteksi publikasi tetap berlaku.
const galleryRoutes = router.route('/admin/galleries');

galleryRoutes.get(
    ...adminOnly,
    cmsController.galleriesCrud.selectAll
);

galleryRoutes.post(
    ...adminOnly,
    uploadCmsImage.single('image'),
    verifyCmsImage,
    requireFile,
    cmsController.galleriesCrud.create
);

const galleryItemRoutes = router.route('/admin/galleries/:id');

galleryItemRoutes.get(
    ...adminOnly,
    cmsController.galleriesCrud.selectOne
);

galleryItemRoutes.put(
    ...adminOnly,
    uploadCmsImage.single('image'),
    verifyCmsImage,
    cmsController.updateGallery
);

galleryItemRoutes.delete(
    ...adminOnly,
    cmsController.deleteGallery
);
registerCrudRoutes('hero', cmsController.heroCrud, 'image', true);
registerCrudRoutes('about-profiles', cmsController.profilesCrud, 'image');
registerCrudRoutes('about-items', cmsController.aboutItemsCrud);
const divisionRoutes = router.route('/admin/organization-divisions');

divisionRoutes.get(
    ...adminOnly,
    cmsController.divisionsCrud.selectAll
);

divisionRoutes.post(
    ...adminOnly,
    cmsController.divisionsCrud.create
);

const divisionItemRoutes = router.route('/admin/organization-divisions/:id');

divisionItemRoutes.get(
    ...adminOnly,
    cmsController.divisionsCrud.selectOne
);

divisionItemRoutes.put(
    ...adminOnly,
    cmsController.updateDivision
);

divisionItemRoutes.delete(
    ...adminOnly,
    cmsController.deleteDivision
);

const memberRoutes = router.route('/admin/organization-members');

memberRoutes.get(
    ...adminOnly,
    cmsController.membersCrud.selectAll
);

memberRoutes.post(
    ...adminOnly,
    uploadCmsImage.single('photo'),
    verifyCmsImage,
    cmsController.membersCrud.create
);

const memberItemRoutes = router.route('/admin/organization-members/:id');

memberItemRoutes.get(
    ...adminOnly,
    cmsController.membersCrud.selectOne
);

memberItemRoutes.put(
    ...adminOnly,
    uploadCmsImage.single('photo'),
    verifyCmsImage,
    cmsController.updateMember
);

memberItemRoutes.delete(
    ...adminOnly,
    cmsController.deleteMember
);

router.patch(
    '/admin/organization-members/:id/unassign',
    ...adminOnly,
    cmsController.unassignMember
);
// Publish / Unpublish setiap personel secara independen
router.patch(
    '/admin/organization-members/:id/status',
    ...adminOnly,
    cmsController.updateMemberStatus
);
const headHistoryCollection = router.route('/admin/head-history');

headHistoryCollection.get(
    ...adminOnly,
    cmsController.historyCrud.selectAll
);

headHistoryCollection.post(
    ...adminOnly,
    uploadCmsImage.single('photo'),
    verifyCmsImage,
    cmsController.historyCrud.create
);

const headHistoryItem = router.route('/admin/head-history/:id');

headHistoryItem.get(
    ...adminOnly,
    cmsController.historyCrud.selectOne
);

headHistoryItem.put(
    ...adminOnly,
    uploadCmsImage.single('photo'),
    verifyCmsImage,
    cmsController.updateHistory
);

headHistoryItem.delete(
    ...adminOnly,
    cmsController.deleteHistory
);

router.patch(
    '/admin/head-history/:id/status',
    ...adminOnly,
    cmsController.updateHistoryStatus
);

module.exports = router;

