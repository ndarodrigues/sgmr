sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    'sap/m/MessageToast',
    "sap/ui/core/Fragment",
    "sap/ui/core/syncStyleClass",
    'sap/ui/model/json/JSONModel'
], function (Controller, UIComponent, History, MessageToast, Fragment, syncStyleClass, JSONModel) {
    "use strict";
    var oController
    var oView

    var aFilters = ""
    var oExpand = ""

    return Controller.extend("com.pontual.sgmr.controller.App", {

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        onNavBack: function () {
            var oHistory, sPreviousHash;

            oHistory = History.getInstance();
            sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("Login", {}, true /*no history*/);
            }
        },

        onSairApp: function () {
            this.getRouter().navTo("Login", {}, true /*no history*/);
        },

        carregarAcessos: function () {

            oController = this;

            var aAutorizacoes = oController.getOwnerComponent().getModel("usuarioModel").getProperty("/Autorizacoes")

            var oAcesso = {
                administrativo: true
            }

            if (aAutorizacoes) {
                aAutorizacoes.forEach(oAutorizacao => {
                    if (oAutorizacao.CodigoAutorizacao == "016" || oAutorizacao.CodigoAutorizacao == "017" || oAutorizacao.CodigoAutorizacao == "018" ||
                        oAutorizacao.CodigoAutorizacao == "019" || oAutorizacao.CodigoAutorizacao == "020") {
                        oAcesso.ordem = true;
                    }
                    if (oAutorizacao.CodigoAutorizacao == "000") {
                        oAcesso.comboio = true;
                    }
                    if (oAutorizacao.CodigoAutorizacao == "001") {
                        oAcesso.administrativo = true;
                    }
                });
            }

            oController.getOwnerComponent().getModel("acessosModel").setData(oAcesso)
            oController.getOwnerComponent().getModel("acessosModel").refresh();
        },

        /** Funções de Banco de Dados */


        gravarLocalStorage: function (pStorage, pData) {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            oStorage.put(pStorage, pData);
        },

        lerLocalStorage: function (pStorage) {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var oData = oStorage.get(pStorage);

            return oData;
        },

        gravarNomeBancoDados: function (pUsuario) {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var data = {
                "databasename": "BDSGMR_" + pUsuario
            };
            oStorage.put("SGMR_StorageSet", data);
        },

        getDatabaseName: function () {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            var oData = oStorage.get("SGMR_StorageSet");

            return oData.databasename;
        },

        getDatabaseVersion: function () {
            return BD_VERSION;
        },


        onInit: function () {
            oController = this;
            oView = oController.getView();

            oView.bindElement("conexaoModel>/");
            oView.bindElement("busyDialogModel>/")

            if (oController.checkConnection() == true) {
                oController.onOnline()
            } else {
                oController.onOffline()
            }

            window.onoffline = (event) => {
                oController.onOffline()
            };

            window.ononline = (event) => {
                oController.onOnline()
            };
            window.addEventListener("orientationchange", oController.onOrientationChange());

            if (window.hasOwnProperty("cordova")) {
                document.addEventListener('deviceready', oController.onDeviceReady.bind(this), false);

            } else {
                oController.getOwnerComponent().getModel("mensagensModel").setData([])
                oController.getOwnerComponent().getRouter().navTo("Login", null, true);
            }
        },

        onDeviceReady: function () {
            if (window.location.hash == "") {
                oController.getOwnerComponent().getModel("mensagensModel").setData([])

                var oConexao = oController.lerLocalStorage("SGMR_DadosConexao")
                if (oConexao != null && oConexao.urlsemclient != "") {
                    oController.getOwnerComponent().getRouter().navTo("Login", null, true);
                } else {
                    oController.getOwnerComponent().getRouter().navTo("Configurar", null, true);
                }
            }
        },

        onOnline: function (oEvent) {
            console.log("You are now connected to the network.");
            oController.getOwnerComponent().getModel("conexaoModel").setProperty("/iconeConexao", "sap-icon://connected")
            oController.getOwnerComponent().getModel("conexaoModel").setProperty("/corIconeConexao", "Success")
            oController.getOwnerComponent().getModel("conexaoModel").setProperty("/statusConexao", "online")
            oController.getOwnerComponent().getModel("conexaoModel").refresh(true)

        },

        onOffline: function (oEvent) {
            console.log("You are not connected to the network.");
            oController.getOwnerComponent().getModel("conexaoModel").setProperty("/iconeConexao", "sap-icon://disconnected")
            oController.getOwnerComponent().getModel("conexaoModel").setProperty("/corIconeConexao", "Error")
            oController.getOwnerComponent().getModel("conexaoModel").setProperty("/statusConexao", "offline")
            oController.getOwnerComponent().getModel("conexaoModel").refresh(true)
        },

        onOrientationChange: function () {
            console.log(screen.orientation.type);
        },


        // Display the button type according to the message with the highest severity
        // The priority of the message types are as follows: Error > Warning > Success > Info
        buttonTypeFormatter: function () {
            var sHighestSeverityIcon;
            var aMessages = this.getView().getModel().oData;

            aMessages.forEach(function (sMessage) {
                switch (sMessage.type) {
                    case "Error":
                        sHighestSeverityIcon = "Negative";
                        break;
                    case "Warning":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" ? "Critical" : sHighestSeverityIcon;
                        break;
                    case "Success":
                        sHighestSeverityIcon = sHighestSeverityIcon !== "Negative" && sHighestSeverityIcon !== "Critical" ? "Success" : sHighestSeverityIcon;
                        break;
                    default:
                        sHighestSeverityIcon = !sHighestSeverityIcon ? "Neutral" : sHighestSeverityIcon;
                        break;
                }
            });

            return sHighestSeverityIcon;
        },

        // Display the number of messages with the highest severity
        highestSeverityMessages: function () {
            var sHighestSeverityIconType = this.buttonTypeFormatter();
            var sHighestSeverityMessageType;

            switch (sHighestSeverityIconType) {
                case "Negative":
                    sHighestSeverityMessageType = "Error";
                    break;
                case "Critical":
                    sHighestSeverityMessageType = "Warning";
                    break;
                case "Success":
                    sHighestSeverityMessageType = "Success";
                    break;
                default:
                    sHighestSeverityMessageType = !sHighestSeverityMessageType ? "Information" : sHighestSeverityMessageType;
                    break;
            }

            return this.getView().getModel().oData.reduce(function (iNumberOfMessages, oMessageItem) {
                return oMessageItem.type === sHighestSeverityMessageType ? ++iNumberOfMessages : iNumberOfMessages;
            }, "");
        },

        // Set the button icon according to the message with the highest severity
        buttonIconFormatter: function () {
            var sIcon;
            var aMessages = this.getView().getModel().oData;

            aMessages.forEach(function (sMessage) {
                switch (sMessage.type) {
                    case "Error":
                        sIcon = "sap-icon://error";
                        break;
                    case "Warning":
                        sIcon = sIcon !== "sap-icon://error" ? "sap-icon://alert" : sIcon;
                        break;
                    case "Success":
                        sIcon = sIcon !== "sap-icon://error" && sIcon !== "sap-icon://alert" ? "sap-icon://sys-enter-2" : sIcon;
                        break;
                    default:
                        sIcon = !sIcon ? "sap-icon://information" : sIcon;
                        break;
                }
            });

            return sIcon;
        },

        descriptografar: function (content) {
            try {
                return atob(content);
            } catch (error) {
                return content;
            }
            v
        },

        carregarDados: function (pServico, pFiltros) {
            oController = this;
            return new Promise((resolve, reject) => {
                var sgmrODataModel = oController.getConnectionModel("sgmrODataModel");
                sgmrODataModel.setHeaders(oController.getModelHeader());
                sgmrODataModel.setUseBatch(false);

                switch (pServico) {
                    case "PerfilSet":
                        oExpand = "AutorizacaoSet"
                        aFilters = [];
                        break;

                    case "ListaAutorizacaoSet":
                        oExpand = ""
                        aFilters = [];
                        break;hh

                    default:
                        break;
                }

                sgmrODataModel.read("/" + pServico, {
                    filters: aFilters,
                    urlParameters: {
                        "$expand": oExpand
                    },
                    success: function (oData, oResponse) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        oController.closeBusyDialog();
                        reject(oError);
                    }
                });
                sgmrODataModel.attachRequestSent(function () {

                });
                sgmrODataModel.attachRequestCompleted(function () {

                });
                sgmrODataModel.attachRequestFailed(function (oError) {
                    oController.closeBusyDialog();
                    oController.atualizarBusyDialog(oError.getParameter("message"));
                    var oMockMessage = {
                        type: 'Error',
                        title: 'Sem Conexão',
                        description: 'Sem conexão com internet no momento. Tente mais tarde novamente',
                        subtitle: 'Problemas de conexão',
                        counter: 1
                    };
                    oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMockMessage)
                    reject(oError);
                });
                sgmrODataModel.attachMetadataLoaded(function () {

                });
                sgmrODataModel.attachMetadataFailed(function (oError) {
                    oController.atualizarBusyDialog(oError.getParameter("message"));
                    oController.closeBusyDialog();
                    var oMockMessage = {
                        type: 'Error',
                        title: 'Sem Conexão',
                        description: 'Sem conexão com internet no momento. Tente mais tarde novamente',
                        subtitle: 'Problemas de conexão',
                        counter: 1
                    };
                    oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMockMessage)
                    reject(oError);
                });

            })
        },

        carregarPerfil: function () {
            return new Promise((resolve, reject) => {
                oController.atualizarBusyDialog(oController.getView().getModel("i18n").getResourceBundle().getText("sincronizandoperfis"));
                oController.carregarDados("PerfilSet", []).then(function (result) {
                    var aPerfis = []
                    for (let x = 0; x < result.results.length; x++) {
                        const oPerfil = result.results[x];
                        oPerfil.AutorizacaoSet = oPerfil.AutorizacaoSet.results;
                        oPerfil.AutorizacaoSet.forEach(element => {
                            delete element.__metadata

                        });


                        delete oPerfil.__metadata
                        aPerfis.push(oPerfil);
                    }
                    oController.getOwnerComponent().getModel("listaPerfilModel").setData(aPerfis)


                    var vDescricao = "Perfis sincronizados " + aPerfis.length
                    var oMensagem = {
                        "title": vDescricao,
                        "description": "Perfis encaminhados para o dispositivo",
                        "type": "Success",
                        "subtitle": "Perfis download"
                    }
                    oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMensagem)

                    resolve()
                }).catch(
                    function (result) {
                        oController.closeBusyDialog();
                        reject(result)
                    })
            })
        },

        carregarAutorizacao: function () {
            return new Promise((resolve, reject) => {
                oController.atualizarBusyDialog(oController.getView().getModel("i18n").getResourceBundle().getText("sincronizandoautorizacoes"));
                oController.carregarDados("ListaAutorizacaoSet", []).then(function (result) {
                    var aAutorizacoes = []
                    for (let x = 0; x < result.results.length; x++) {
                        const oAutorizacao = result.results[x];
                        oAutorizacao.AutorizacaoSet = oAutorizacao;
                        // oAutorizacao.forEach(element => {
                        //     delete element.__metadata

                        // });


                        delete oAutorizacao.__metadata
                        aAutorizacoes.push(oAutorizacao);
                    }
                    oController.getOwnerComponent().getModel("listaAutorizacao").setData(aAutorizacoes)


                    var vDescricao = "Autorizações sincronizadas " + aAutorizacoes.length
                    var oMensagem = {
                        "title": vDescricao,
                        "description": "Autorizações encaminhados para o dispositivo",
                        "type": "Success",
                        "subtitle": "Autorizações download"
                    }
                    oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMensagem)

                    resolve()
                }).catch(
                    function (result) {
                        oController.closeBusyDialog();
                        reject(result)
                    })
            })
        },

        atualizarBusyDialog: function (pMensagem) {
            oController = this;
            oController.getOwnerComponent().getModel("busyDialogModel").setProperty("/mensagem", pMensagem)
            oController.getOwnerComponent().getModel("busyDialogModel").refresh()
        },

        closeBusyDialog: function () {
            var loginInProgress = false;
            try {
                loginInProgress = this.getOwnerComponent().getModel("busyDialogModel").getProperty("/loginInProgress");
            } catch (e) {
                loginInProgress = false;
            }

            if (!loginInProgress && this._pBusyDialog) {
                this._pBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.close();
                });
            }
        },

        sincronizarReceber: function (pCatalogo) {

            // oController = this;
            // return new Promise((resolve, reject) => {

            //     if (oController.checkConnection() == true) {

            //         //Preencher aqui com todos os serviços que precisam ser chamados e carregados
            //         var aLeituras = [
            //             oController.carregarPerfil(),
            //         ]

            //     } else {
            //         oController.closeBusyDialog();
            //         reject()
            //     }
            // })
            resolve()

        },

        sincronizar: function (pCatalogo) {
            oController = this;
            oController.carregarPerfil()
            oController.carregarAutorizacao()

        },

        openBusyDialog: function () {
            oController = this;
            oController.getOwnerComponent().getModel("busyDialogModel").setProperty("/mensagem", "Iniciando sincronismo")
            oController.getOwnerComponent().getModel("busyDialogModel").refresh()

            var oComponent = this.getOwnerComponent();
            if (!oComponent._busyDialog && !this._pBusyDialog) {
                this._pBusyDialog = Fragment.load({
                    name: "com.pontual.sgrm.fragment.BusyDialog",
                    controller: this
                }).then(function (oBusyDialog) {
                    this.getView().addDependent(oBusyDialog);
                    syncStyleClass("sapUiSizeCompact", this.getView(), oBusyDialog);
                    return oBusyDialog;
                }.bind(this));

                oComponent._busyDialog = this._pBusyDialog;
            } else if (oComponent._busyDialog) {
                this._pBusyDialog = oComponent._busyDialog;
            }

            this._pBusyDialog.then(function (oBusyDialog) {
                oBusyDialog.open();
            }.bind(this));
        },

        forceCloseBusyDialog: function () {
            if (this._pBusyDialog) {
                this._pBusyDialog.then(function (oBusyDialog) {
                    oBusyDialog.close();
                });
            }

            try {
                var oComponent = this.getOwnerComponent();
                if (oComponent && oComponent._busyDialog) {
                    oComponent._busyDialog.then(function (oBusyDialog) {
                        oBusyDialog.close();
                    });
                }
            } catch (e) {
                // Silently handle error
            }

            try {
                var aBusyDialogs = document.querySelectorAll('.sapMBusyDialog');
                if (aBusyDialogs.length > 0) {
                    for (var i = 0; i < aBusyDialogs.length; i++) {
                        var oBusyElement = aBusyDialogs[i];
                        var oBusyControl = sap.ui.getCore().byId(oBusyElement.id);
                        if (oBusyControl && oBusyControl.close) {
                            oBusyControl.close();
                        }
                    }
                }
            } catch (e) {
                // Silently handle error
            }
        },

        getConnectionModel: function (pModel) {
            oController = this;

            var oController = this;
            if (typeof cordova != "undefined") {

                var oDataModel = oController.getOwnerComponent().getModel(pModel)
                var oConexao = oController.lerLocalStorage("SGMR_DadosConexao")

                var vUrl = oConexao.urlsemclient + oDataModel.sServiceUrl + "?sap-client=" + oConexao.cliente;

                var model = new sap.ui.model.odata.v2.ODataModel(vUrl, {
                    json: true
                });

                model.setHeaders(this.getModelHeader());
                model.setUseBatch(false);
                return model;

            } else {
                return oController.getOwnerComponent().getModel(pModel);

            }

        },

        getModelHeader: function () {
            var oHeader = {
                "X-Requested-With": "X",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "MaxDataServiceVersion": "3.0"
            };

            return oHeader;
        }
    });
});
