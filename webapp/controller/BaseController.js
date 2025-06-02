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
				ordem: false,
				comboio: false,
				administrativo: false
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
				"databasename": "BDCMM_" + pUsuario
			};
			oStorage.put("CMM_StorageSet", data);
		},

		getDatabaseName: function () {
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
			var oData = oStorage.get("CMM_StorageSet");

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



    });
});
