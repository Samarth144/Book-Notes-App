const asyncHandler = require('express-async-handler');
const { getRecommendations } = require('../services/recommendationService');

const getRecommendationsPage = asyncHandler(async (req, res) => {
    const userId = req.session.user.id;
    const recommendations = await getRecommendations(userId);

    res.render('recommendations', {
        title: 'Recommendations',
        recommendations,
    });
});

module.exports = {
    getRecommendationsPage,
};
