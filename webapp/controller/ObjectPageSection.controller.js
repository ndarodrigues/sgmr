sap.ui.define([
    "com/pontual/sgmr/controller/BaseController",
    "com/pontual/sgmr/model/formatter",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/ui/model/json/JSONModel'
],
    function (Controller, formatter, MessagePopover, MessageItem, JSONModel) {
        "use strict";
        var oView
        var oController

        return Controller.extend("com.pontual.sgmr.controller.ObjectPageSection", {
            onInit: function () {
                oController = this;
                oController.oController = this;
                oView = oController.getView();
                
                var oModel = new JSONModel();
                oModel.setData([]);
                this.getView().setModel(oModel);

                oView.bindElement("objectPageModel>/")

                var oTesteModel = {
                    country: "Brasil",
                    company: "Pontual"
                }

                oController.getOwnerComponent().getModel("objectPageModel").setData(oTesteModel);

                this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this._oRouter.getRoute("ObjectPageSection").attachMatched(this._handleRouteMatched, this);

            },

            _handleRouteMatched: function (oEvent) {

                
            }

        });
    });
