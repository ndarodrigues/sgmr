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
    
	const BD_VERSION = 7;
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

        criptografar: function (content) {
            return btoa(unescape(encodeURIComponent(content)));
        },

        descriptografar: function (content) {
            try {
                return atob(content);
            } catch (error) {
                return content;
            }
            v
        },

        enviarDados: function (pServico, pDados) {

            oController = this;
            return new Promise((resolve, reject) => {
                var sgmrODataModel = oController.getConnectionModel("sgmrODataModel");
                sgmrODataModel.setHeaders(oController.getModelHeader());
                sgmrODataModel.setUseBatch(false);
                sgmrODataModel.create("/" + pServico, pDados, {
                    success: function (oData) {
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
                    oController.atualizarBusyDialog(oError.getParameter("message"));
                    oController.closeBusyDialog()
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
                    oController.closeBusyDialog()
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
                        break; hh

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
            // oController = this;
            // oController.carregarPerfil()
            // oController.carregarAutorizacao()
            oController = this;

            return new Promise((resolve, reject) => {
                if (oController.checkConnection() == true) {
                    oController.getOwnerComponent().getModel("mensagensModel").setData([])
                    oController.verificarDisponibilidadeServidor().then(
                        function (result) {
                            oController.sincronizarEnviar(pCatalogo).then(
                                function (result) {
                                    oController.sincronizarReceber(pCatalogo).then(
                                        function (result) {
                                            var loginInProgress = false;
                                            try {
                                                loginInProgress = oController.getOwnerComponent().getModel("busyDialogModel").getProperty("/loginInProgress");
                                            } catch (e) {
                                                loginInProgress = false;
                                            }

                                            if (!loginInProgress) {
                                                oController.closeBusyDialog();
                                            }
                                            resolve(result)
                                        }).catch(
                                            function (result) {
                                                oController.forceCloseBusyDialog();
                                                reject(result)
                                            })
                                }).catch(
                                    function (result) {
                                        oController.forceCloseBusyDialog();
                                        reject(result)
                                    })
                        }).catch(
                            function (result) {
                                oController.closeBusyDialog();
                                reject(result)
                            })
                } else {
                    reject()
                }
            })


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
        },

        prepararPerfil1: function () {
            // return new Promise((resolve, reject) => {
            // oController.atualizarBusyDialog(oController.getView().getModel("i18n").getResourceBundle().getText("atualizandoperfis"));
            var aPerfis = oController.getOwnerComponent().getModel("listaPerfilModel").getData();
            var aPerfilSet = []

            aPerfis.forEach(oPerfil => {
                switch (oPerfil.Sincronizado) {
                    case "N":
                        var oPerfilSet = {
                            "CodigoPerfil": 0,
                            "DescrPerfil": oPerfil.DescrPerfil,
                            "Sincronizado": "N",
                            "AutorizacaoSet": []
                        }
                        oPerfil.AutorizacaoSet.forEach(oAutorizacao => {
                            if (oAutorizacao.Selecionado == true) {
                                var oAutorizacaoSet =
                                {
                                    "CodigoPerfil": 0,
                                    "CodigoAutorizacao": oAutorizacao.CodigoAutorizacao,
                                    "DescrAutorizacao": oAutorizacao.DescrAutorizacao
                                }
                                oPerfilSet.AutorizacaoSet.push(oAutorizacaoSet)
                            }
                        })
                        aPerfilSet.push(oController.enviarDados("PerfilSet", oPerfilSet))
                        break;
                    case "E":
                        var oPerfilSet = {
                            "CodigoPerfil": oPerfil.CodigoPerfil,
                            "DescrPerfil": oPerfil.DescrPerfil,
                            "Sincronizado": "E",
                            "AutorizacaoSet": []
                        }
                        aPerfilSet.push(oController.enviarDados("PerfilSet", oPerfilSet))
                        break;

                    default:
                        break;
                }


            });

            if (aPerfilSet.length > 0) {
                // Promise.all(aPerfilSet).then(
                // function (result) {
                result.forEach(oPerfil => {
                    var vTipo
                    switch (oPerfil.Tipomensagem) {
                        case "S":
                            vTipo = "Success"
                            break;
                        case "E":
                            vTipo = "Error"
                            break;
                        default:
                            break;
                    }
                    var oMensagem = {
                        "title": "Gestão de perfil",
                        "description": oPerfil.Mensagem,
                        "type": vTipo,
                        "subtitle": oPerfil.Mensagem
                    }
                    oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMensagem)

                });

                // resolve()
                // }).catch(
                //     function (result) {
                //         oController.closeBusyDialog();
                //         // reject()
                //     })
                // } else {
                // resolve()
                // }

                // })
            }
        },

        prepararPerfil: function () {
            return new Promise((resolve, reject) => {
                oController.atualizarBusyDialog(oController.getView().getModel("i18n").getResourceBundle().getText("atualizandoperfis"));
                var aPerfis = oController.getOwnerComponent().getModel("listaPerfilModel").getData();
                var aPerfilSet = []

                aPerfis.forEach(oPerfil => {
                    switch (oPerfil.Sincronizado) {
                        case "N":
                            var oPerfilSet = {
                                "CodigoPerfil": 0,
                                "DescrPerfil": oPerfil.DescrPerfil,
                                "Sincronizado": "N",
                                "AutorizacaoSet": []
                            }
                            oPerfil.AutorizacaoSet.forEach(oAutorizacao => {
                                if (oAutorizacao.Selecionado == true) {
                                    var oAutorizacaoSet =
                                    {
                                        "CodigoPerfil": 0,
                                        "CodigoAutorizacao": oAutorizacao.CodigoAutorizacao,
                                        "DescrAutorizacao": oAutorizacao.DescrAutorizacao
                                    }
                                    oPerfilSet.AutorizacaoSet.push(oAutorizacaoSet)
                                }
                            })
                            aPerfilSet.push(oController.enviarDados("PerfilSet", oPerfilSet))
                            break;
                        case "E":
                            var oPerfilSet = {
                                "CodigoPerfil": oPerfil.CodigoPerfil,
                                "DescrPerfil": oPerfil.DescrPerfil,
                                "Sincronizado": "E",
                                "AutorizacaoSet": []
                            }
                            aPerfilSet.push(oController.enviarDados("PerfilSet", oPerfilSet))
                            break;

                        default:
                            break;
                    }


                });

                if (aPerfilSet.length > 0) {
                    Promise.all(aPerfilSet).then(
                        function (result) {
                            result.forEach(oPerfil => {
                                var vTipo
                                switch (oPerfil.Tipomensagem) {
                                    case "S":
                                        vTipo = "Success"
                                        break;
                                    case "E":
                                        vTipo = "Error"
                                        break;
                                    default:
                                        break;
                                }
                                var oMensagem = {
                                    "title": "Gestão de perfil",
                                    "description": oPerfil.Mensagem,
                                    "type": vTipo,
                                    "subtitle": oPerfil.Mensagem
                                }
                                oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMensagem)

                            });

                            resolve()
                        }).catch(
                            function (result) {
                                oController.closeBusyDialog();
                                reject()
                            })
                } else {
                    resolve()
                }

            })
        },

        onSincronizarGeral: function (pController, pCatalogo) {
            var aMockMessages = []
            if (oController.checkConnection() == true) {
                oController = pController
                oController.openBusyDialog();
                oController.sincronizar(pCatalogo).then(function (result) {
                    oController.closeBusyDialog();

                    var aMensagens = oController.getOwnerComponent().getModel("mensagensModel").getData();

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

                    var oModel = new JSONModel();
                    oModel.setData(aMockMessages);
                    oController.getView().setModel(oModel);
                    oController.getView().getModel().refresh()

                }).catch(
                    function (result) {
                        oController.closeBusyDialog();
                    });
            } else {
                MessageToast.show("Dispositivo sem conexão com a internet no momento.");
                var oMockMessage = {
                    type: 'Error',
                    title: 'Sem Conexão',
                    description: 'Sem conexão com internet no momento. Tente mais tarde novamente',
                    subtitle: 'Problemas de conexão',
                    counter: 1
                };
                aMockMessages.push(oMockMessage)

                var oModel = new JSONModel();
                oModel.setData(aMockMessages);
                this.getView().setModel(oModel);
            }


        },

        sincronizarEnviar: function (pCatalogo) {
            oController = this;
            return new Promise((resolve, reject) => {
                if (oController.checkConnection() == true) {
                    Promise.all([oController.finalizarOperacoes(pCatalogo),
                    oController.atualizarPerfil(),
                    oController.atualizarUsuario(),
                    oController.atualizarComboio(),
                    oController.atualizarOrdemCorretiva(),
                    oController.criarOrdens()]).then(
                        function (result) {
                            resolve()
                        }).catch(
                            function (result) {
                                reject()
                            });
                } else {
                    reject()
                }
            })
        },

        atualizarPerfil: function () {
            return new Promise((resolve, reject) => {
                oController.lerTabelaIndexDB("tb_perfil").then(
                    function (result) {
                        if (result.tb_perfil) {
                            oController.getOwnerComponent().getModel("listaPerfilModel").setData(result.tb_perfil);
                            oController.prepararPerfil().then(
                                function (result) {
                                    resolve()
                                }).catch(
                                    function (result) {
                                        reject()
                                    })
                        }

                    }).catch(
                        function (result) {
                            reject(result)
                        })

            })
        },

        carregarOffline: function (pCatalogo) {

            oController = this;
            return new Promise((resolve, reject) => {

                oController.atualizarBusyDialog(oController.getView().getModel("i18n").getResourceBundle().getText("carregaroffline"));
                var aLeituras = [
                    oController.carregarDadosIndexDB("tb_autorizacao", "autorizacoesModel"),
                    oController.carregarDadosIndexDB("tb_perfil", "listaPerfilModel"),
                    oController.carregarDadosIndexDB("tb_usuario", "listaUsuariosModel")
                ]
                Promise.all(aLeituras).then(
                    function (result) {
                        resolve()

                    }).catch(
                        function (result) {
                            oController.closeBusyDialog();
                            reject(result)
                        })

            })

        },

        carregarDadosIndexDB: function (pTabela, pModel) {
            oController = this;

            return new Promise((resolve, reject) => {

                oController.lerTabelaIndexDB(pTabela).then(
                    function (result) {
                        oController.getOwnerComponent().getModel(pModel).setData(result[pTabela])
                        resolve()
                    }).catch(
                        function (result) {
                            reject()
                        })

            })
        },

        lerTabelaIndexDB: function (pTabela) {

            oController = this;

            return new Promise((resolve, reject) => {

                console.log("Iniciando leitura da tabela " + pTabela);

                var oDBData

                var db;
                var databaseName = oController.getDatabaseName();
                var databaseVersion = oController.getDatabaseVersion();
                var openRequest = window.indexedDB.open(databaseName, databaseVersion);

                openRequest.onerror = function (event) {
                    console.log(openRequest.errorCode);
                    reject('Erro durante a leitura do banco de dados!')
                };

                openRequest.onsuccess = function (event) {
                    db = event.target.result;
                    db.onerror = function () {
                        console.log(db.errorCode);
                        reject('Erro durante a leitura do banco de dados!')
                    };

                    const transaction = db.transaction([pTabela], "readwrite")
                    transaction.oncomplete = event => {
                        db.close();
                        var data = {};
                        data[pTabela] = oDBData;
                        resolve(data)
                    };

                    const objectStore = transaction.objectStore(pTabela);

                    if ('getAll' in objectStore) {
                        var values = objectStore.getAll().onsuccess = function (event) {
                            oDBData = {};
                            oDBData = event.target.result;

                        };
                    } else {
                        objectStore.openCursor().onsuccess = function (event) {
                            var cursor = event.target.result;
                            if (cursor) {
                                var value = cursor.value;
                                values.push(value);
                                cursor.continue();
                            } else {
                                oDBData = {};
                                oDBData = values;
                            }
                        };
                    }
                };
            })
        },

        checkConnection: function () {
            if (window.hasOwnProperty("cordova")) {
                switch (navigator.connection.type) {
                    case 'unknown':
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/iconeConexao", "sap-icon://disconnected")
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/corIconeConexao", "Error")
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/statusConexao", "offline")
                        this.getOwnerComponent().getModel("conexaoModel").refresh(true)
                        return false
                    case 'none':
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/iconeConexao", "sap-icon://disconnected")
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/corIconeConexao", "Error")
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/statusConexao", "offline")
                        this.getOwnerComponent().getModel("conexaoModel").refresh(true)
                        return false
                    default:
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/iconeConexao", "sap-icon://connected")
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/corIconeConexao", "Success")
                        this.getOwnerComponent().getModel("conexaoModel").setProperty("/statusConexao", "online")
                        this.getOwnerComponent().getModel("conexaoModel").refresh(true)
                        return true;
                }
            } else {
                this.getOwnerComponent().getModel("conexaoModel").setProperty("/iconeConexao", "sap-icon://connected")
                this.getOwnerComponent().getModel("conexaoModel").setProperty("/corIconeConexao", "Success")
                this.getOwnerComponent().getModel("conexaoModel").setProperty("/statusConexao", "online")
                this.getOwnerComponent().getModel("conexaoModel").refresh(true)
                return navigator.onLine

            }
        },

        verificarDisponibilidadeServidor: function () {
            oController = this;
            var oConexao = oController.lerLocalStorage("CMM_DadosConexao")
            oController.getOwnerComponent().getModel("configurarModel").setData(oConexao)

            return new Promise((resolve, reject) => {

                if (oConexao.verificarDisponibilidade) {
                    if (oController.checkConnection() == true) {
                        if (oConexao.url) {
                            oController.openBusyDialog();
                            oController.atualizarBusyDialog("Tentando conexão com o endereço " + oConexao.url);

                            fetch(oConexao.urlsemclient, { mode: 'no-cors' }).then(r => {
                                oController.atualizarBusyDialog("Conexão com o endereço " + oConexao.urlsemclient + " estabelecida com sucesso");

                                var oMockMessage = {
                                    type: 'Success',
                                    title: oController.getView().getModel("i18n").getResourceBundle().getText("sucessoservidor"),
                                    description: "Conexão com o endereço " + oConexao.urlsemclient + " estabelecida com sucesso",
                                    subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("conexaosucesso"),
                                    counter: 1
                                };

                                oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMockMessage)

                                resolve()

                            })
                                .catch(e => {
                                    oController.atualizarBusyDialog("Não foi possível alcançar o endereço " + oConexao.urlsemclient + "informado");

                                    var oMockMessage = {
                                        type: 'Error',
                                        title: oController.getView().getModel("i18n").getResourceBundle().getText("erroservidor"),
                                        description: "Não foi possível alcançar o endereço " + oConexao.urlsemclient + " informado.",
                                        subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("conexaoerro"),
                                        counter: 1
                                    };

                                    oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMockMessage)
                                    reject()
                                });
                        } else {
                            var oMockMessage = {
                                type: 'Error',
                                title: oController.getView().getModel("i18n").getResourceBundle().getText("configurarconexao"),
                                description: "Configure os dados de conexão antes de continuar",
                                subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("conexaosem"),
                                counter: 1
                            };

                            oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMockMessage)

                            reject()
                        }

                    } else {
                        var oMockMessage = {
                            type: 'Error',
                            title: oController.getView().getModel("i18n").getResourceBundle().getText("testeerro"),
                            description: "Por favor verifque a disponibilidade de rede ou wi-fi.",
                            subtitle: oController.getView().getModel("i18n").getResourceBundle().getText("conexaosem"),
                            counter: 1
                        };

                        oController.getOwnerComponent().getModel("mensagensModel").getData().push(oMockMessage)

                        reject()
                    }
                } else {
                    resolve()
                }
            })

        },

    });
});
