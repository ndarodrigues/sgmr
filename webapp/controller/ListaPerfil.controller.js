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
        var oController;
        var oView;
        var oMessagePopover;

        return Controller.extend("com.pontual.sgmr.controller.ListaPerfil", {
            onInit: function () {
                oController = this;
                oView = oController.getView();

                oView.bindElement("listaPerfilModel>/");
                oView.bindElement("layoutTelaModel>/");
                oView.bindElement("busyDialogModel>/")

                var oModel = new JSONModel();
                oModel.setData([]);
                this.getView().setModel(oModel);

                this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this._oRouter.getRoute("ListaPerfil").attachMatched(this._handleRouteMatched, this);

            },


            _handleRouteMatched: function (oEvent) {

                var aFilters = []
                var filter = new sap.ui.model.Filter({ path: "Sincronizado", operator: sap.ui.model.FilterOperator.NE, value1: "E" });
                aFilters.push(filter);
                this.getView().byId("idListaPerfilTable").getBinding("items").filter(aFilters, "Application");

                var oModel = new JSONModel();
                oModel.setData([]);
                this.getView().setModel(oModel);

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

                    }
                });

                var aMensagens = oController.getOwnerComponent().getModel("mensagensModel").getData();
                var aMockMessages = []
                if (aMensagens.length != undefined) {
                    aMensagens.forEach(mensagem => {
                        var oMockMessage = {
                            type: mensagem.type,
                            title: mensagem.title,
                            active: false,
                            description: mensagem.description,
                            subtitle: mensagem.subtitle
                        }
                        aMockMessages.push(oMockMessage)
                    });
                }

                oController.getOwnerComponent().getModel("mensagensModel").setData([])

                oModel.setData(aMockMessages);
                this.getView().setModel(oModel);
                this.byId("messagePopoverBtn").addDependent(oMessagePopover);

            },


            onNavBack: function () {
                this.getRouter().navTo("Administrativo", {}, true /*no history*/);
            },


            onEliminarPerfil: function (oEvent) {
                var oPerfil = oEvent.getSource().getBindingContext("listaPerfilModel").getModel().getProperty(oEvent.getSource().getBindingContext("listaPerfilModel").getPath());
                var aUsuarios = oController.getOwnerComponent().getModel("listaUsuariosModel").getData()
                var oUsuario = aUsuarios.find(function (pUsuario) {
                    return pUsuario.Perfil === oPerfil.DescrPerfil
                })
                if (oUsuario == undefined) {
                    oPerfil.Sincronizado = "E"
                    oController.getOwnerComponent().getModel("listaPerfilModel").refresh()
                    oController.limparTabelaIndexDB("tb_perfil").then(
                        function (result) {
                            oController.gravarTabelaIndexDB("tb_perfil", oController.getOwnerComponent().getModel("listaPerfilModel").getData()).then(
                                function (result) {
                                    MessageToast.show("Perfil marcado para eliminação.");
                                    oController.perfilUpdate().then(
                                        function (result) {
                                            MessageToast.show("Perfil eliminado com sucesso");
                                            var aMensagens = oController.getOwnerComponent().getModel("mensagensModel").getData();
                                            oController.getView().getModel().setData(aMensagens);
                                            oController.getView().getModel().refresh()
                                        }).catch(
                                            function (result) {

                                            })
                                }).catch(
                                    function (result) {

                                    })
                        }).catch(
                            function (result) {

                            })
                } else {
                    MessageToast.show("Perfil associado a usuário. Remova antes de eliminar.");
                    var oMockMessage = {
                        type: 'Error',
                        title: 'Perfil em uso',
                        description: 'Perfil associado a usuário. Remova antes de eliminar.',
                        subtitle: 'Perfil',
                        counter: 1
                    };
                    oController.getView().getModel().setData([oMockMessage]);
                    oController.getView().getModel().refresh()
                }
            },

            onPerfilPress: function (oEvent) {
                var oPerfil = oEvent.getSource().getBindingContext("listaPerfilModel").getModel().getProperty(oEvent.getSource().getBindingContext("listaPerfilModel").getPath());
                var oObjetoNovo = JSON.parse(JSON.stringify(oPerfil));
                oObjetoNovo.HabilitarTelaCriarPerfil = false
                oController.getOwnerComponent().getModel("perfilCriarModel").setData(oObjetoNovo);
                oController.getOwnerComponent().getModel("perfilCriarModel").refresh()
                oController.getOwnerComponent().getRouter().navTo("CriarPerfil", null, true);
            },

            onCriarPerfil: function (oEvent) {

                var oPerfil = {
                    CodigoPerfil: 0,
                    DescrPerfil: "",
                    Sincronizado: "N",
                    HabilitarTelaCriarPerfil: true,
                    AutorizacaoSet: [
                        {
                            CodigoAutorizacao: "016",
                            DescrAutorizacao: "ATIVIDADES DE LAVADOR",
                            Selecionado: false
                        },
                        {
                            CodigoAutorizacao: "017",
                            DescrAutorizacao: "ATIVIDADES DE LUBRIFICADOR",
                            Selecionado: false
                        },
                        {
                            CodigoAutorizacao: "018",
                            DescrAutorizacao: "ATIVIDADES DE MECÂNICA",
                            Selecionado: false
                        },
                        {
                            CodigoAutorizacao: "019",
                            DescrAutorizacao: "ATIVIDADES DE ELÉTRICA",
                            Selecionado: false
                        },
                        {
                            CodigoAutorizacao: "020",
                            DescrAutorizacao: "ATIVIDADES DE BORRACHARIA",
                            Selecionado: false
                        },
                        {
                            CodigoAutorizacao: "000",
                            DescrAutorizacao: "COMBOIO",
                            Selecionado: false
                        },
                        {
                            CodigoAutorizacao: "001",
                            DescrAutorizacao: "ADMINISTRADOR",
                            Selecionado: false
                        }

                    ]
                }

                oController.getOwnerComponent().getModel("perfilCriarModel").setData(oPerfil);
                oController.getOwnerComponent().getModel("perfilCriarModel").refresh()
                oController.getOwnerComponent().getRouter().navTo("CriarPerfil", null, true);
            },

            onSincronizar: function (oEvent) {
                oController.onSincronizarGeral(oController, false)

            },

            handleMessagePopoverPress: function (oEvent) {
                oMessagePopover.toggle(oEvent.getSource());
            }

        });
    });
