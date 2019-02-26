to enable style sheet:
`npm install webpack --save`
`npm install style-loader css-loader --save`

to enable google fonts 
(https://scotch.io/@micwanyoike/how-to-add-fonts-to-a-react-project)
(https://www.npmjs.com/package/webfontloader)
`npm install webfontloader --save`


to enable svg image (svg-inline-loader and react-inlinesvg and dependencies):
https://www.npmjs.com/package/svg-inline-loader
`npm install loader-utils --save`
`npm install object-assign --save`
`npm install simple-html-tokenizer --save`
`npm install svg-inline-loader --save`

from https://www.npmjs.com/package/react-inlinesvg
`npm install httplease --save`
`npm install once --save`
`npm install react --save`
`npm install react-inlinesvg --save` 

try this https://blog.hellojs.org/importing-images-in-react-c76f0dfcb552


into front-end-monorepo/packages/lib-classifier/webpack.dev.js

line 38:
      { 
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      { 
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }





!!!!!!! Working on text entry for period