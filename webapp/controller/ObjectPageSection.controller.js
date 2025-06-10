sap.ui.define([
    "com/pontual/sgmr/controller/BaseController",
    "com/pontual/sgmr/model/formatter",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/ui/model/json/JSONModel',
    "sap/m/Dialog",
    "sap/m/Button",
],
    function (Controller, formatter, MessagePopover, MessageItem, JSONModel, Dialog, Button) {
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


            },

            _handleExibirRoleteSuperior: function (oEvent) {
                oController._handleExibirImagem()
            },

            _handleExibirImagem: function (oEvent) {
                // Create the image
                var oImage = new sap.m.Image({
                    src: "http://localhost:8080/img/roletesuperior.png",
                    width: "100%",    // Adjust width and height as needed
                    height: "auto",
                    decorative: false, // For accessibility
                    alt: "Rolete Superior"
                });

                // Create the dialog
                var oDialog = new sap.m.Dialog({
                    title: "Rolete Superior",
                    content: [oImage],
                    beginButton: new sap.m.Button({
                        text: "Fechar",
                        press: function () {
                            oDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oDialog.destroy(); // Optional: Clean up
                    }
                });

                // Open the dialog
                oDialog.open();


            },

        });
    });
