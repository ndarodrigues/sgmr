sap.ui.define([
    "com/pontual/sgmr/controller/BaseController",
    "com/pontual/sgmr/model/formatter",
    'sap/m/MessagePopover',
    'sap/m/MessageItem',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',

],
    function (Controller, formatter, MessagePopover, MessageItem, JSONModel, MessageToast) {
        "use strict";
        var oController
        var oView
        var oMessagePopover;

        return Controller.extend("com.pontual.sgmr.controller.Login", {
            onInit: function () {
                oController = this;
                oView = oController.getView();


                oView.bindElement("conexaoModel>/");
                oView.bindElement("loginModel>/");
                oView.bindElement("busyDialogModel>/")

                var oModel = new JSONModel();
                oModel.setData([]);
                this.getView().setModel(oModel);

                this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this._oRouter.getRoute("Login").attachMatched(this._handleRouteMatched, this);

            },


            _handleRouteMatched: function (oEvent) {
                var urlLogo = oController.obterArquivo("logo.png")
                var oLogin = {
                    CodUsuario: "",
                    Senha: "",
                    imgLogo: urlLogo
                }

                oController.getOwnerComponent().getModel("loginModel").setData(oLogin);
                oController.getOwnerComponent().getModel("usuarioModel").setData({});

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

                oController.prepararLogin()

            },

            prepararLogin: function () {
                if (oController.checkConnection() == true) {
                    oController.verificarDisponibilidadeServidor().then(
                        function () {
                            oController.carregarPerfil().then(function (result) {
                                oController.carregarUsuario().then(function (result) {
                                    var aListaUsuarios = oController.getOwnerComponent().getModel("listaUsuariosModel").getData()
                                    if (aListaUsuarios.length > 0) {
                                        oController.gravarLocalStorage("SGMR_Login", aListaUsuarios)
                                        oController.getOwnerComponent().getModel("usuariosLoginModel").setData(aListaUsuarios)
                                        oView.byId("entrarButton").setEnabled(true)
                                    }
                                    oController.closeBusyDialog();
                                })

                            })
                        }).catch(
                            function (result) {
                                var aListaUser = oController.lerLocalStorage("SGMR_Login")
                                if (aListaUser != null && aListaUser.length > 0) {
                                    var oMockMessage3 = {
                                        type: 'Warning',
                                        title: 'Sem Conexão',
                                        description: 'Não foi possível conectar ao SAP. Prosseguindo com acesso offline.',
                                        subtitle: 'Problemas de conexão',
                                        counter: 1
                                    };
                                    oController.getOwnerComponent().getModel("usuariosLoginModel").setData(aListaUser)
                                    oController.getView().getModel().setData([oMockMessage3]);
                                    oController.getView().getModel().refresh()
                                    oView.byId("entrarButton").setEnabled(true)
                                } else {
                                    MessageToast.show("Por favor, verificar suas conexões antes do primeiro acesso!");
                                    var oMockMessage = {
                                        type: 'Error',
                                        title: 'Sem Conexão',
                                        description: 'Sem conexão com internet no momento. Tente mais tarde novamente',
                                        subtitle: 'Problemas de conexão',
                                        counter: 1
                                    };
                                    var oMockMessage2 = {
                                        type: 'Error',
                                        title: 'Primeiro Acesso',
                                        description: 'É necessário conexão com o SAP antes do primeiro acesso',
                                        subtitle: 'Problemas de conexão',
                                        counter: 1
                                    };
                                    oController.getView().getModel().setData([oMockMessage, oMockMessage2]);
                                    oController.getView().getModel().refresh()
                                    oView.byId("entrarButton").setEnabled(false)
                                }
                                oController.closeBusyDialog();
                            });
                } else {
                    var aListaUser = oController.lerLocalStorage("SGMR_Login")
                    if (aListaUser != null && aListaUser.length > 0) {
                        oController.getOwnerComponent().getModel("usuariosLoginModel").setData(aListaUser)
                        oView.byId("entrarButton").setEnabled(true)
                    } else {
                        MessageToast.show("Por favor, verificar suas conexões antes do primeiro acesso!");
                        var oMockMessage = {
                            type: 'Error',
                            title: 'Sem Conexão',
                            description: 'Sem conexão com internet no momento. Tente mais tarde novamente',
                            subtitle: 'Problemas de conexão',
                            counter: 1
                        };
                        var oMockMessage2 = {
                            type: 'Error',
                            title: 'Primeiro Acesso',
                            description: 'É necessário conexão com o SAP antes do primeiro acesso',
                            subtitle: 'Problemas de conexão',
                            counter: 1
                        };
                        oController.getView().getModel().setData([oMockMessage, oMockMessage2]);
                        oController.getView().getModel().refresh()
                        oView.byId("entrarButton").setEnabled(false)
                    }
                }

            },

            onConfigurar: function () {
                oController.getOwnerComponent().getRouter().navTo("Configurar", null, true);
            },

            onLogin: function (oEvent) {
                oController.getOwnerComponent().getRouter().navTo("Inicio", null, true);
            },

            iniciarAplicativo: function (oEvent) {
                oController.openBusyDialog();
                oController.getOwnerComponent().getModel("busyDialogModel").setProperty("/loginInProgress", true);
                var vUsuario = oView.byId("usuarioInput").getValue();

                oController.prepararIndexDB(vUsuario.toUpperCase()).then(
                    function (result) {
                        oController.sincronizar(true).then(function (result) {
                            // Busy será fechado no controller Inicio após carregamento completo
                            oController.carregarAcessos()
                            oController.getOwnerComponent().getRouter().navTo("Inicio", null, true);
                        }).catch(
                            function (result) {
                                oController.carregarOffline().then(function (result) {
                                    var aMensagens = oController.getOwnerComponent().getModel("mensagensModel").getData();
                                    oController.getView().getModel().setData(aMensagens);
                                    oController.getView().getModel().refresh()
                                    // Busy será fechado no controller Inicio após carregamento completo
                                    oController.carregarAcessos()
                                    oController.getOwnerComponent().getRouter().navTo("Inicio", null, true);
                                })

                            });
                    }
                ).catch(
                    function (result) {
                        var aMensagens = oController.getOwnerComponent().getModel("mensagensModel").getData();
                        oController.getView().getModel().setData(aMensagens);
                        oController.getView().getModel().refresh()
                        oController.getOwnerComponent().getModel("busyDialogModel").setProperty("/loginInProgress", false);
                        oController.forceCloseBusyDialog();
                    });
            },

            handleMessagePopoverPress: function (oEvent) {
                oMessagePopover.toggle(oEvent.getSource());
            },

            carregarUsuariosOffLine: function () {
                var aListaUser = oController.lerLocalStorage("SGMR_Login")
                oController.getOwnerComponent().getModel("usuariosLoginModel").setData(aListaUser)
            }
        });
    });