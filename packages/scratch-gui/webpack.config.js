const path = require('path');
const webpack = require('webpack');

// Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ScratchWebpackConfigBuilder = require('scratch-webpack-configuration');

// =======================================================================
// NUEVO: Variable dinámica para la ruta base.
// Si construimos para producción (GitHub Pages), usa el subdirectorio.
// Si estamos en local (npm start), usa la raíz (/).
// =======================================================================
const basePath = process.env.NODE_ENV === 'production' ? '/MLScratch/' : '/';

const commonHtmlWebpackPluginOptions = {
    gtm_id: process.env.GTM_ID || '',
    gtm_env_auth: process.env.GTM_ENV_AUTH || ''
};

const cssModuleExceptions = [
    /\.raw\.css$/, 
    /[\\/]driver\.js[\\/].*\.css$/ 
];

const baseConfig = new ScratchWebpackConfigBuilder(
    {
        rootPath: path.resolve(__dirname),
        enableReact: true,
        enableTs: true,
        shouldSplitChunks: false,
        cssModuleExceptions
    })
    .setTarget('browserslist')
    // =======================================================================
    // FIX FOR GITHUB PAGES SUBDIRECTORY DEPLOYMENT (scratch-storage)
    // =======================================================================
    .addModuleRule({
        test: /scratch-storage[\\/]dist[\\/]web[\\/]scratch-storage\.js$/,
        loader: 'string-replace-loader',
        options: {
            search: 'chunks/fetch-worker',
            // NUEVO: Añadimos dinámicamente el basePath al reemplazo
            replace: `${basePath}chunks/fetch-worker`,
            flags: 'g'
        }
    })
    // =======================================================================
    // FIX FOR GITHUB PAGES SUBDIRECTORY DEPLOYMENT (scratch-vm)
    // =======================================================================
    .addModuleRule({
        test: /scratch-vm[\\/]dist[\\/]web[\\/]scratch-vm\.js$/,
        loader: 'string-replace-loader',
        options: {
            search: 'extension-worker.js',
            // NUEVO: Añadimos dinámicamente el basePath al reemplazo
            replace: `${basePath}extension-worker.js`,
            flags: 'g'
        }
    })
    .merge({
        output: {
            assetModuleFilename: 'static/assets/[name].[hash][ext][query]',
            library: {
                name: 'GUI',
                type: 'umd2'
            },
            clean: false
        },
        resolve: {
            fallback: {
                Buffer: require.resolve('buffer/'),
                stream: require.resolve('stream-browserify')
            }
        }
    })
    .addModuleRule({
        test: /\.(svg|png|wav|mp3|gif|jpg)$/,
        resourceQuery: /^$/, 
        type: 'asset' 
    })
    .addPlugin(new webpack.DefinePlugin({
        'process.env.DEBUG': Boolean(process.env.DEBUG),
        'process.env.GA_ID': `"${process.env.GA_ID || 'UA-000000-01'}"`,
        'process.env.GTM_ENV_AUTH': `"${process.env.GTM_ENV_AUTH || ''}"`,
        'process.env.GTM_ID': process.env.GTM_ID ? `"${process.env.GTM_ID}"` : null
    }))
    .addPlugin(new CopyWebpackPlugin({
        patterns: [
            { from: '../../node_modules/scratch-blocks/media', to: 'static/blocks-media/default' },
            { from: '../../node_modules/scratch-blocks/media', to: 'static/blocks-media/high-contrast' },
            { from: 'src/lib/settings/color-mode/high-contrast/blocks-media', to: 'static/blocks-media/high-contrast', force: true },
            { context: '../../node_modules/@scratch/scratch-vm/dist/web', from: 'extension-worker.{js,js.map}', noErrorOnMissing: true },
            { context: '../../node_modules/scratch-storage/dist/web', from: 'chunks/fetch-worker.*.{js,js.map}', noErrorOnMissing: true },
            { context: '../../node_modules/scratch-storage/dist/web', from: 'chunks/vendors-*.{js,js.map}', noErrorOnMissing: true },
            { from: '../../node_modules/@mediapipe/face_detection', to: 'chunks/mediapipe/face_detection' }
        ]
    }));

if (!process.env.CI) {
    baseConfig.addPlugin(new webpack.ProgressPlugin());
}

const distConfig = baseConfig.clone()
    .merge({
        entry: {
            'scratch-gui': path.join(__dirname, 'src/index.ts')
        },
        output: {
            // NUEVO: Usar la variable basePath
            publicPath: basePath, 
            path: path.resolve(__dirname, 'dist')
        }
    })
    .addExternals(['react', 'react-dom', 'redux', 'react-redux'])
    .addPlugin(new CopyWebpackPlugin({
        patterns: [{ from: 'src/lib/libraries/*.json', to: 'libraries', flatten: true }]
    }));

const distStandaloneConfig = baseConfig.clone()
    .merge({
        entry: { 'scratch-gui-standalone': path.join(__dirname, 'src/index-standalone.tsx') },
        output: { path: path.resolve(__dirname, 'dist') }
    });

const buildConfig = baseConfig.clone()
    .enableDevServer(process.env.PORT || 8601)
    .merge({
        entry: {
            gui: './src/playground/index.jsx',
            guistandalone: './src/playground/standalone.jsx',
            blocksonly: './src/playground/blocks-only.jsx',
            compatibilitytesting: './src/playground/compatibility-testing.jsx',
            player: './src/playground/player.jsx'
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            // NUEVO: Usar la variable basePath para arreglar el error 404 del gui.js
            publicPath: basePath 
        }
    })
    .addPlugin(new HtmlWebpackPlugin({ ...commonHtmlWebpackPluginOptions, chunks: ['gui'], template: 'src/playground/index.ejs', title: 'ML Scratch' }))
    .addPlugin(new HtmlWebpackPlugin({ ...commonHtmlWebpackPluginOptions, chunks: ['guistandalone'], filename: 'standalone.html', template: 'src/playground/index.ejs', title: 'ML Scratch: Standalone Mode' }))
    .addPlugin(new HtmlWebpackPlugin({ ...commonHtmlWebpackPluginOptions, chunks: ['blocksonly'], filename: 'blocks-only.html', template: 'src/playground/index.ejs', title: 'ML Scratch: Blocks Only Example' }))
    .addPlugin(new HtmlWebpackPlugin({ ...commonHtmlWebpackPluginOptions, chunks: ['compatibilitytesting'], filename: 'compatibility-testing.html', template: 'src/playground/index.ejs', title: 'ML Scratch: Compatibility Testing' }))
    .addPlugin(new HtmlWebpackPlugin({ ...commonHtmlWebpackPluginOptions, chunks: ['player'], filename: 'player.html', template: 'src/playground/index.ejs', title: 'ML Scratch: Player Example' }))
    .addPlugin(new CopyWebpackPlugin({
        patterns: [
            { from: 'static', to: 'static' },
            { from: 'extensions/**', to: 'static', context: 'src/examples' }
        ]
    }));

const buildDist = process.env.NODE_ENV === 'production' || process.env.BUILD_MODE === 'dist';

let config;
switch (process.env.BUILD_TYPE) {
case 'dist': config = distConfig.get(); break;
case 'dist-standalone': config = distStandaloneConfig.get(); break;
default: config = buildConfig.get(); break;
}

module.exports = buildDist ? config : buildConfig.get();