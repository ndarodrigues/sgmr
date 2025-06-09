sap.ui.define(['sap/uxap/BlockBase'],
	function (BlockBase) {
		"use strict";

		var RoletesSuperiores = BlockBase.extend("com.pontual.sgmr.controller.RoletesInferiores", {
			metadata: {
				views: {
					Collapsed: {
						viewName: "com.pontual.sgmr.view.RoletesInferiores",
						type: "XML"
					},
					Expanded: {
						viewName: "com.pontual.sgmr.view.RoletesInferiores",
						type: "XML"
					}
				}
			}
		});

		return RoletesSuperiores;

	});
