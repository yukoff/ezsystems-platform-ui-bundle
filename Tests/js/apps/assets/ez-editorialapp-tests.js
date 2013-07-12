YUI.add('ez-editorialapp-tests', function (Y) {

    var app, appTest,
        capiMock,
        container = Y.one('.app'), docHeight = container.get('docHeight'),

        LOAD_CONTENT_RESPONSE = {
            "Content": {
                "_media-type": "application\/vnd.ez.api.Content+json",
                "_href": "\/api\/ezp\/v2\/content\/objects\/57",
                "_remoteId": "8a9c9c761004866fb458d89910f52bee",
                "_id": 57,
                "ContentType": {
                    "_media-type": "application\/vnd.ez.api.ContentType+json",
                    "_href": "\/api\/ezp\/v2\/content\/types\/23"
                },
                "Name": "Home",
                "MainLocation": {
                    "_media-type": "application\/vnd.ez.api.Location+json",
                    "_href": "\/api\/ezp\/v2\/content\/locations\/1\/2"
                },
                "Owner": {
                    "_media-type": "application\/vnd.ez.api.User+json",
                    "_href": "\/api\/ezp\/v2\/user\/users\/14"
                },
                "lastModificationDate": "2010-09-14T10:46:59+02:00",
                "publishedDate": "2007-11-19T14:54:46+01:00",
                "mainLanguageCode": "eng-GB",
                "alwaysAvailable": "true"
            }
        },
        LOAD_USER_RESPONSE = {"User": {"_id": 14}},
        LOAD_LOCATION_RESPONSE = {"Location": {"id": 2}},
        LOAD_CONTENTTYPE_RESPONSE = {"ContentType": {"id": 23}};

    capiMock = new Y.Mock();
    app = new Y.eZ.EditorialApp({
        container: '.app',
        viewContainer: '.view-container',
        capi: capiMock
    });
    app.render();

    appTest = new Y.Test.Case({
        name: "eZ Editorial App tests",

        "Should open the application": function () {
            var nextCalled = false;

            app.open({}, {}, function () {
                nextCalled = true;
            });

            Y.assert(nextCalled, "Next middleware should have been called");
            Y.assert(
                container.hasClass('is-app-open'),
                "The app container should have the class is-app-open"
            );
            Y.Assert.areEqual(
                app.get('viewContainer').getStyle('height').replace('px', ''),
                docHeight,
                "The view container should have the same height as the document"
            );
        },

        "Should close the application": function () {
            app.close();

            this.wait(function () {
                Y.assert(
                    !container.hasClass('is-app-open'),
                    "The app container should not have the class is-app-open"
                );

                Y.Assert.areEqual(
                    container.getStyle('transform'),
                    'none',
                    "The container should have 'none' as transform"
                );

                Y.Assert.areEqual(
                    app.get('viewContainer').getStyle('height'),
                    'auto',
                    "The view container should have 'auto' as height"
                );
            }, 400);
        },

        "Should open again the application": function () {
            this["Should open the application"]();
        },


        "Should close again the application": function () {
            this["Should close the application"]();
        },

        "Should close the application when contentEditView:close event is fired": function () {
            app.open();

            app.fire('contentEditView:close');

            this.wait(function () {
                Y.assert(
                    !container.hasClass('is-app-open'),
                    "The app container should not have the class is-app-open"
                );
            }, 400);
        },

        "Should load the content info and the current version and the associated entities": function () {
            var contentServiceMock, userServiceMock, contentTypeServiceMock,
                nextCalled = false, vars,
                contentId = 59;

            contentServiceMock = Y.Mock();
            userServiceMock = Y.Mock();
            contentTypeServiceMock = Y.Mock();
            Y.Mock.expect(capiMock, {
                method: 'getContentService',
                args: [],
                returns: contentServiceMock
            });
            Y.Mock.expect(capiMock, {
                method: 'getUserService',
                args: [],
                returns: userServiceMock
            });
            Y.Mock.expect(capiMock, {
                method: 'getContentTypeService',
                args: [],
                returns: contentTypeServiceMock
            });

            Y.Mock.expect(contentServiceMock, {
                method: 'loadContentInfoAndCurrentVersion',
                args: ["/api/ezp/v2/content/objects/" + contentId, Y.Mock.Value.Function],
                run: function (uri, callback) {
                    callback(false, {body: Y.JSON.stringify(LOAD_CONTENT_RESPONSE)});
                }
            });

            Y.Mock.expect(userServiceMock, {
                method: 'loadUser',
                args: [LOAD_CONTENT_RESPONSE.Content.Owner._href, Y.Mock.Value.Function],
                run: function (uri, callback) {
                    callback(false, {body: Y.JSON.stringify(LOAD_USER_RESPONSE)});
                }
            });
            Y.Mock.expect(contentServiceMock, {
                method: 'loadLocation',
                args: [LOAD_CONTENT_RESPONSE.Content.MainLocation._href, Y.Mock.Value.Function],
                run: function (uri, callback) {
                    callback(false, {body: Y.JSON.stringify(LOAD_LOCATION_RESPONSE)});
                }
            });
            Y.Mock.expect(contentTypeServiceMock, {
                method: 'loadContentType',
                args: [LOAD_CONTENT_RESPONSE.Content.ContentType._href, Y.Mock.Value.Function],
                run: function (uri, callback) {
                    callback(false, {body: Y.JSON.stringify(LOAD_CONTENTTYPE_RESPONSE)});
                }
            });

            app.loadContentForEdit({params: {id: contentId}}, {}, function () {
                nextCalled = true;
            });

            Y.Mock.verify(capiMock);
            Y.Mock.verify(contentServiceMock);
            Y.Mock.verify(contentTypeServiceMock);
            Y.Mock.verify(userServiceMock);

            Y.assert(nextCalled, 'Next middleware should have been called');

            vars = app.get('contentEditViewVariables');
            Y.Assert.areEqual(LOAD_CONTENT_RESPONSE.Content._id, vars.content._id);
            Y.Assert.areEqual(LOAD_USER_RESPONSE.User._id, vars.owner._id);
            Y.Assert.areEqual(LOAD_CONTENTTYPE_RESPONSE.ContentType.id, vars.contentType.id);
            Y.Assert.areEqual(LOAD_LOCATION_RESPONSE.Location.id, vars.mainLocation.id);
        }
    });

    Y.Test.Runner.setName("eZ Editorial App tests");
    Y.Test.Runner.add(appTest);


}, '0.0.1', {requires: ['test', 'ez-editorialapp', 'json']});