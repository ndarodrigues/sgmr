sap.ui.define([
    "com/pontual/sgmr/controller/BaseController",
    "com/pontual/sgmr/model/formatter",
    'sap/m/MessageToast',
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/ui/model/json/JSONModel'
],
    function (Controller, formatter, MessageToast, MessagePopover, MessageItem, JSONModel) {
        "use strict";
        var oController
        var oView
        var oMessagePopover;
        var aMockMessages;

        return Controller.extend("com.pontual.sgmr.controller.CriarPerfil", {
            onInit: function () {
                oController = this;
                oView = oController.getView();

                oView.bindElement("perfilCriarModel>/");

                var oMessageTemplate = new MessageItem({
                    type: '{type}',
                    title: '{title}',
                    activeTitle: "{active}",
                    description: '{description}',
                    subtitle: '{subtitle}',
                    counter: '{counter}'
                });

                oMessagePopover = new MessagePopover({
                    items: {
                        path: '/',
                        template: oMessageTemplate
                    },
                    activeTitlePress: function () {
                        MessageToast.show('Active title is pressed');
                    }
                });

                var oModel = new JSONModel();
                oModel.setData([]);
                this.getView().setModel(oModel);
                this.byId("messagePopoverBtn").addDependent(oMessagePopover);

                this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this._oRouter.getRoute("CriarPerfil").attachMatched(this._handleRouteMatched, this);

            },


            _handleRouteMatched: function (oEvent) {

                aMockMessages = [];
                var oModel = new JSONModel();
                oModel.setData(aMockMessages);
                this.getView().setModel(oModel);

                var oPerfilInput = oView.byId("perfilInput")
                oPerfilInput.setValueState("None");

                var oConfirmarButton = oView.byId("confirmarPerfilButton")

                oConfirmarButton.setBusy(false);

                 var oPerfil = oController.getOwnerComponent().getModel("perfilCriarModel").getData()
                 oPerfil.AutorizacaoSet.forEach(element => {
                    element.Selecionado = false
                 });
                 oController.getOwnerComponent().getModel("perfilCriarModel").refresh()

            },


            onNavBack: function () {
                this.getRouter().navTo("ListaPerfil", {}, true /*no history*/);
            },

            onCancelarPerfil: function () {
                this.getRouter().navTo("ListaPerfil", {}, true /*no history*/);
            },

            onConfirmarPerfil: function () {

                var aMockMessages = [];
                var vPodeGravar = true;
                var oMockMessage = {}
                var oPerfil = oController.getOwnerComponent().getModel("perfilCriarModel").getData()
                var oPerfilInput = oView.byId("perfilInput")
                var oConfirmarButton = oView.byId("confirmarPerfilButton")
                oConfirmarButton.setEnabled(false);
                oConfirmarButton.setBusy(true);

                if (oPerfil.DescrPerfil == "") {
                    oPerfilInput.setValueState("Error");
                    var oMockMessage = {
                        type: 'Error',
                        title: oController.getView().getModel("i18n").getResourceBundle().getText("campoobrigatorio"),
                        description: oController.getView().getModel("i18n").getResourceBundle().getText("campoperfil"),
                        subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("perfil"),
                        counter: 1
                    };
                    aMockMessages.push(oMockMessage)
                    vPodeGravar = false;

                } else {
                    if (oController.getOwnerComponent().getModel("listaPerfilModel").getData().length != undefined) {
                        var oPerfilExistente = oController.getOwnerComponent().getModel("listaPerfilModel").getData().find((oElement) => oElement.DescrPerfil.toUpperCase() == oPerfil.DescrPerfil.toUpperCase());
                        if (oPerfilExistente != undefined) {
                            oPerfilInput.setValueState("Error");
                            var oMockMessage = {
                                type: 'Error',
                                title: oController.getView().getModel("i18n").getResourceBundle().getText("perfilexistente"),
                                description: oController.getView().getModel("i18n").getResourceBundle().getText("perfilexistentemsg"),
                                subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("perfil"),
                                counter: 1
                            };
                            aMockMessages.push(oMockMessage)
                            vPodeGravar = false;
                        }
                    }
                }

                var vAutorizacoes = oPerfil.AutorizacaoSet.find((oOperacao) => oOperacao.Selecionado == true);
                if (vAutorizacoes == undefined) {
                    var oMockMessage = {
                        type: 'Error',
                        title: oController.getView().getModel("i18n").getResourceBundle().getText("campoobrigatorio"),
                        description: oController.getView().getModel("i18n").getResourceBundle().getText("campoautorizacao"),
                        subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("autorizacao"),
                        counter: 1
                    };
                    aMockMessages.push(oMockMessage)
                    vPodeGravar = false;
                }

                var oModel = new JSONModel();
                oModel.setData(aMockMessages);
                this.getView().setModel(oModel);

                if (vPodeGravar == true) {
                    oPerfilInput.setValueState("None");
                    oView.byId("idListaAutorizacoesTable").getSelectedContextPaths().forEach(element => {
                        // oController.getOwnerComponent().getModel("perfilCriarModel").setProperty(element + '/Selecionado', true )
                    });

                    if (oController.getOwnerComponent().getModel("listaPerfilModel").getData().length == undefined) {
                        oController.getOwnerComponent().getModel("listaPerfilModel").setData([])
                        oController.getOwnerComponent().getModel("listaPerfilModel").getData().push(oPerfil)
                    } else {
                        oController.getOwnerComponent().getModel("listaPerfilModel").getData().push(oPerfil)
                    }

                    oController.getOwnerComponent().getModel("listaPerfilModel").refresh()
                    oController.closeBusyDialog();
                    oController.getRouter().navTo("ListaPerfil", {}, true /*no history*/);
                    oConfirmarButton.setEnabled(true);
                    oConfirmarButton.setBusy(false);

                } else {
                    oConfirmarButton.setEnabled(true);
                    oConfirmarButton.setBusy(false);
                }
            },


            handleMessagePopoverPress: function (oEvent) {
                oMessagePopover.toggle(oEvent.getSource());
            }


        });
    });
