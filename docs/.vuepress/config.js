module.exports = {
  title: '@reststate/mobx',
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        ga: 'UA-128167246-3',
      },
    ],
  ],
  themeConfig: {
    nav: [
      { text: '@reststate/mobx', link: '/' },
      { text: 'github', link: 'https://github.com/reststate/reststate-vuex' },
      { text: '/vuex', link: 'https://vuex.reststate.codingitwrong.com' },
      { text: '/client', link: 'https://client.reststate.codingitwrong.com' },
      { text: 'home', link: 'https://reststate.codingitwrong.com' },
    ],
    sidebar: ['/', 'tutorial', 'installation', 'reading-data', 'writing-data'],
    displayAllHeaders: true,
  },
};
