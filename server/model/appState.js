var _ = require('underscore'); // Utilities. http://underscorejs.org/
var Backbone = require('backbone'); // Data model utilities. http://backbonejs.org/
var moment = require('moment'); // Date processing. http://momentjs.com/
var BaseModel = require('./baseModel.js').BaseModel;
var ContentUpdater = require('./contentUpdater.js').ContentUpdater;
var ClientUpdater = require('./clientUpdater.js').ClientUpdater;

exports.AppState = BaseModel.extend({
    defaults: {
        lastHeart: null,
        contentUpdater: null,
        clientUpdater: null
    },

    initialize: function() {
        this.set('contentUpdater', new ContentUpdater(config.contentUpdater));
        this.set('clientUpdater', new ClientUpdater(config.clientUpdater));
        io.sockets.on('connection', _.bind(this._onConnection, this));
    },

    _onConnection: function(socket) {
        socket.on('updateContent', _.bind(this.updateContent, this));
    },

    onOSC: function(action, message) {
        if (!this.onOSC.handlerCache) {
            this.onOSC.handlerCache = {};
        }

        var handler = this.onOSC.handlerCache[action];
        if (handler) {
            handler(message);
        }

        handler = this['_on' + action[0].toUpperCase() + action.substr(1)];
        if (!handler) {
            return;
        }

        handler = _.bind(handler, this);
        this.onOSC.handlerCache[action] = handler;

        handler(message);
    },

    _onHeart: function(message) {
        this.set('lastHeart', moment());
    },

    updateContent: function() {
        this.get('contentUpdater').update(_.bind(this._onContentUpdated, this));
    },

    _onContentUpdated: function(error) {
        if (error) {
            console.log(error);
            throw error;
        }

        console.log('Content update complete! ' + this.get('contentUpdater').get('updated').toString());
        this.updateClient();
    },

    updateClient: function() {
        this.get('clientUpdater').update(_.bind(this._onClientUpdated, this));
    },

    _onClientUpdated: function(error) {
        if (error) {
            console.log(error);
            throw error;
        }

        console.log('Client update complete! ' + this.get('clientUpdater').get('updated').toString());
    }
});
