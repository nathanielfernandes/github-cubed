var ghpages = require('gh-pages');

ghpages.publish(
    'public',
    {
        branch: 'gh-pages',
        repo: 'https://github.com/nathanielfernandes/github-cubed',
        user: {
            name: 'Nathaniel Fernandes',
            email: 'nathanielfernandes@gmail.com'
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)