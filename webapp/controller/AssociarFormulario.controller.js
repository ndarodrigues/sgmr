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

        return Controller.extend("com.pontual.sgmr.controller.AssociarFormulario", {
            onInit: function () {

                oController = this;
                oView = oController.getView();

                var omaterialRodante = [{
                    Codigo: "EX12005",
                    DescrMaterialRodante: "HITACHI - EX 1200-5",
                    Sincronizado: "N",
                    HabilitarTelaCriarmaterialRodante: true,
                    AutorizacaoSet: [
                        {
                            CodigoAutorizacao: "01",
                            DescrAutorizacao: "INSPEÇÃO MATERIAL RODANTE",
                            Selecionado: true
                        },
                        {
                            CodigoAutorizacao: "02",
                            DescrAutorizacao: "MOVIMENTAÇÃO MATERIAL RODANTE",
                            Selecionado: true
                        }


                    ]},
                    {
                        Codigo: "EX12006",
                        DescrMaterialRodante: "HITACHI - EX 1200-6",
                        Sincronizado: "N",
                        HabilitarTelaCriarmaterialRodante: true,
                        AutorizacaoSet: [
                            {
                                CodigoAutorizacao: "01",
                                DescrAutorizacao: "INSPEÇÃO MATERIAL RODANTE",
                                Selecionado: true
                            },


                        ]
                    }
                ]


                oController.getOwnerComponent().getModel("listaMaterialRodanteModel").setData(omaterialRodante);
                oController.getOwnerComponent().getModel("listaMaterialRodanteModel").refresh()


                oView.bindElement("listaMaterialRodanteModel>/");
                oView.bindElement("layoutTelaModel>/");
                oView.bindElement("busyDialogModel>/")
                oView.bindElement("objectPageModel>/")
                oView.bindElement("condicaoOperacaoModel>/")
                oView.bindElement("inspecaoModel>/")
                oView.bindElement("condicaoModel>/")
                oView.bindElement("formularioModel>/")
                
                var aCondicoes = [{ key: "Formulário 321" }, { key: "Formulário 322" }, { key: "Formulário 323" }]
                oController.getOwnerComponent().getModel("formularioModel").setData(aCondicoes);
                oController.getOwnerComponent().getModel("formularioModel").refresh();

                var oModel = new JSONModel();
                oModel.setData([]);
                this.getView().setModel(oModel);

                this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this._oRouter.getRoute("AssociarFormulario").attachMatched(this._handleRouteMatched, this);

            },


            _handleRouteMatched: function (oEvent) {

                var aFilters = []
                var filter = new sap.ui.model.Filter({ path: "Sincronizado", operator: sap.ui.model.FilterOperator.NE, value1: "E" });
                aFilters.push(filter);
                this.getView().byId("idListaMaterialRodanteTable").getBinding("items").filter(aFilters, "Application");

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


            onEliminarmaterialRodante: function (oEvent) {
                var omaterialRodante = oEvent.getSource().getBindingContext("listaMaterialRodanteModel").getModel().getProperty(oEvent.getSource().getBindingContext("listaMaterialRodanteModel").getPath());
                var aUsuarios = oController.getOwnerComponent().getModel("listaUsuariosModel").getData()
                var oUsuario = aUsuarios.find(function (pUsuario) {
                    return pUsuario.materialRodante === omaterialRodante.DescrmaterialRodante
                })
                if (oUsuario == undefined) {
                    omaterialRodante.Sincronizado = "E"
                    oController.getOwnerComponent().getModel("listaMaterialRodanteModel").refresh()
                    oController.limparTabelaIndexDB("tb_materialRodante").then(
                        function (result) {
                            oController.gravarTabelaIndexDB("tb_materialRodante", oController.getOwnerComponent().getModel("listaMaterialRodanteModel").getData()).then(
                                function (result) {
                                    MessageToast.show("materialRodante marcado para eliminação.");
                                    oController.materialRodanteUpdate().then(
                                        function (result) {
                                            MessageToast.show("materialRodante eliminado com sucesso");
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
                    MessageToast.show("materialRodante associado a usuário. Remova antes de eliminar.");
                    var oMockMessage = {
                        type: 'Error',
                        title: 'materialRodante em uso',
                        description: 'materialRodante associado a usuário. Remova antes de eliminar.',
                        subtitle: 'materialRodante',
                        counter: 1
                    };
                    oController.getView().getModel().setData([oMockMessage]);
                    oController.getView().getModel().refresh()
                }
            },

            onMaterialRodantePress: function (oEvent) {
                var omaterialRodante = oEvent.getSource().getBindingContext("listaMaterialRodanteModel").getModel().getProperty(oEvent.getSource().getBindingContext("listaMaterialRodanteModel").getPath());
                var oObjetoNovo = JSON.parse(JSON.stringify(omaterialRodante));
                oObjetoNovo.HabilitarTelaCriarmaterialRodante = false
                oController.getOwnerComponent().getModel("materialRodanteCriarModel").setData(oObjetoNovo);
                oController.getOwnerComponent().getModel("materialRodanteCriarModel").refresh()
                oController.getOwnerComponent().getRouter().navTo("ObjectPageSection", null, true);
            },

            onCriarmaterialRodante: function (oEvent) {

                var omaterialRodante = {
                    CodigomaterialRodante: 0,
                    DescrmaterialRodante: "",
                    Sincronizado: "N",
                    HabilitarTelaCriarmaterialRodante: true,
                    AutorizacaoSet: [
                        {
                            CodigoAutorizacao: "01",
                            DescrAutorizacao: "INSPEÇÃO MATERIAL RODANTE",
                            Selecionado: false
                        }, {
                            CodigoAutorizacao: "02",
                            DescrAutorizacao: "MOVIMENTAÇÃO MATERIAL RODANTE",
                            Selecionado: false
                        }
                        


                    ]
                }

                oController.getOwnerComponent().getModel("materialRodanteCriarModel").setData(omaterialRodante);
                oController.getOwnerComponent().getModel("materialRodanteCriarModel").refresh()
                oController.getOwnerComponent().getRouter().navTo("CriarMaterialRodante", null, true);
            },

            onSincronizar: function (oEvent) {
                oController.onSincronizarGeral(oController, false)

            },

            handleMessagePopoverPress: function (oEvent) {
                oMessagePopover.toggle(oEvent.getSource());
            }

        });
    });
