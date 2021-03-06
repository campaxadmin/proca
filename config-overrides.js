const webpack = require('webpack');
const { paths } = require('react-app-rewired');
const { useBabelRc,override} = require('customize-cra')
const { addReactRefresh } = require('customize-cra-react-refresh')
const CompressionPlugin = require('compression-webpack-plugin')
const path = require('path');

/* for brotli (future version) 
  const zlib = require('zlib');
  config.plugins.push(new CompressionPlugin({
      filename: '[path].br[query]',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11,
      },
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: false
    }));

*/

const appPackageJson = require(paths.appPackageJson);
const minorVersion = appPackageJson.version.split(".").slice(0,2).join("-");

//paths.appIndexJs = paths.appIndexJs.replace('index.js','Widget.js'); // NOT WORKING, modified index.js
// potential workaround : https://gist.github.com/benedictjohannes/33f93ccd2a66b9c150460c525937a8d3
//
const conditionalImport = (alias,journey) =>{
//  config.resolve.alias['Conditional_Share$']= path.resolve(__dirname, 'src/components/')+'/Disabled.js';
  const j = journey.flat();
  let steps = {
    'petition': 'Petition',
    'share': 'Share',
    'button': 'FAB',
    'twitter': 'Twitter',
    'dialog': 'Dialog',
    'clickify': 'Clickify',
    'html': 'Html',
    'register.CH': 'bespoke/Register-CH',
  };

  for (let [k,v] of Object.entries(steps)) {
    const Component = j.includes(k)? v : 'Disabled';
    alias['Conditional_'+v+'$']= path.resolve(__dirname, 'src/components/')+'/'+Component+'.js';
  }
}

  const stringified = (raw) => {
    const d ={
    'process.widget': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {})
    };
    // syntax step1,step2, step3+substep3.1+substep3.2, step4  ('+' to have substeps, like in a dialog)
    raw.journey = raw.journey.split(',');
    raw.journey.forEach ((d,i) => {
      const sub= d.split('+');
      if (sub.length === 1) return;
      raw.journey[i]=sub;
    });
    d['process.widget'].journey = JSON.stringify(raw.journey);
    return d;
  };

module.exports = function override (config, env) {
// todo: add babel +                  "i18next-extract",
  useBabelRc();

  if (!process.env.widget) 
    process.env.widget="_default";
  let widget= require('dotenv').config({ path: './config/'+process.env.widget+'.yaml' }).parsed;
  if (!widget.journey)
    widget.journey="petition,share";
  console.log(widget);
  //process.exit(1);
  // doesn't work addWebpackPlugin(new webpack.DefinePlugin(stringified(w.parsed)));
  config.plugins.unshift(new webpack.DefinePlugin(stringified(widget)));
  config.plugins.push(new CompressionPlugin());
//  config = addReactRefresh({ overlay: {sockIntegration: 'whm' }}) (config,env);
  config.optimization.runtimeChunk = false;
  config.optimization.splitChunks = {
    cacheGroups: {
      default: false
    }
  };
  conditionalImport(config.resolve.alias,widget.journey);

//  config.resolve.alias['locales']= path.resolve(__dirname, 'src/locales/');
  config.resolve.alias['locales']= path.resolve(__dirname, 'src/locales/'+widget.lang.toLowerCase());

  if (config.mode === 'production') {
    //config.output.filename= 'static/js/[name].'+minorVersion+'.js'
    config.output.filename= 'd/'+widget.filename+'/index.js'
  }
/* to prevent loading react
  config.externals = {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
 *
 *
 *
 */
  /*
     filename: isEnvProduction
        : isEnvDevelopment && 'static/js/bundle.js',
*/
  config.output.libraryTarget= 'umd';
  config.output.library = ["proca"];

  return config
}


