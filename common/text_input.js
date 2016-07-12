/*
 * (c) Copyright Ascensio System SIA 2010-2016
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at Lubanas st. 125a-25, Riga, Latvia,
 * EU, LV-1021.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

(function(window, undefined)
{
	///
	// такие методы нужны в апи
	// baseEditorsApi.prototype.Begin_CompositeInput = function()
	// baseEditorsApi.prototype.Replace_CompositeText = function(arrCharCodes)
	// baseEditorsApi.prototype.Set_CursorPosInCompositeText = function(nPos)
	// baseEditorsApi.prototype.Get_CursorPosInCompositeText = function()
	// baseEditorsApi.prototype.End_CompositeInput = function()
	// baseEditorsApi.prototype.Get_MaxCursorPosInCompositeText = function()

	// baseEditorsApi.prototype.onKeyDown = function(e)
	// baseEditorsApi.prototype.onKeyPress = function(e)
	// baseEditorsApi.prototype.onKeyUp = function(e)
	///

	var c_oCompositionState = {
		start   : 0,
		process : 1,
		end     : 2
	};

	function CTextInput(api)
	{
		this.Api = api;

		this.compositionValue = [];		// коды символов
		this.compositionState = c_oCompositionState.end;

		this.TargetId = null;			// id caret
		this.HtmlDiv  = null;			// для незаметной реализации одной textarea недостаточно
		this.HtmlArea = null;

		this.HtmlAreaOffset = 60;

		this.LockerTargetTimer = -1;

		this.KeyDownFlag               = false;
		this.TextInputAfterComposition = false;

		this.IsLockTargetMode = false;

		this.IsUseFirstTextInputAfterComposition = false;

		this.nativeFocusElement = null;
		this.InterfaceEnableKeyEvents = true;
	}

	CTextInput.prototype =
	{
		init : function(target_id)
		{
			this.TargetId   = target_id;
			var oHtmlTarget = document.getElementById(this.TargetId);
			var oHtmlParent = oHtmlTarget.parentNode;

			this.HtmlDiv                  = document.createElement("div");
			this.HtmlDiv.id               = "area_id_parent";
			this.HtmlDiv.style.background = "transparent";
			this.HtmlDiv.style.border     = "none";
			this.HtmlDiv.style.position   = "absolute";
			this.HtmlDiv.style.zIndex     = 0;
			this.HtmlDiv.style.width      = "20px";
			this.HtmlDiv.style.height     = "50px";
			this.HtmlDiv.style.overflow   = "hidden";

			this.HtmlArea                      = document.createElement("textarea");
			this.HtmlArea.id                   = "area_id";
			this.HtmlArea.style.background     = "transparent";
			this.HtmlArea.style.border         = "none";
			this.HtmlArea.style.position       = "absolute";
			this.HtmlArea.style["text-shadow"] = "0 0 0 #000";
			this.HtmlArea.style.outline        = "none";
			this.HtmlArea.style.color          = "transparent";
			this.HtmlArea.style.width          = "1000px";
			this.HtmlArea.style.height         = "50px";
			this.HtmlArea.style.overflow       = "hidden";

			this.HtmlArea.style.left = "0px;";
			this.HtmlArea.style.top  = (-this.HtmlAreaOffset) + "px";

			this.HtmlArea.setAttribute("spellcheck", false);

			this.HtmlDiv.appendChild(this.HtmlArea);

			if (true)
			{
				// нужен еще один родитель. чтобы скроллился он, а не oHtmlParent
				var oHtmlDivScrollable              = document.createElement("div");
				oHtmlDivScrollable.id 				= "area_id_main";
				oHtmlDivScrollable.style.background = "transparent";
				oHtmlDivScrollable.style.border     = "none";
				oHtmlDivScrollable.style.position   = "absolute";
				oHtmlDivScrollable.style.padding    = "0";
				oHtmlDivScrollable.style.margin     = "0";
				oHtmlDivScrollable.style.zIndex     = 0;

				var parentStyle                   = getComputedStyle(oHtmlParent);
				oHtmlDivScrollable.style.left     = parentStyle.left;
				oHtmlDivScrollable.style.top      = parentStyle.top;
				oHtmlDivScrollable.style.width    = parentStyle.width;
				oHtmlDivScrollable.style.height   = parentStyle.height;
				oHtmlDivScrollable.style.overflow = "hidden";

				oHtmlDivScrollable.appendChild(this.HtmlDiv);
				oHtmlParent.parentNode.appendChild(oHtmlDivScrollable);
			}
			else
			{
				oHtmlParent.appendChild(this.HtmlDiv);
			}

			// events:
			var oThis                   = this;
			this.HtmlArea["onkeydown"]  = function(e)
			{
				return oThis.onKeyDown(e);
			};
			this.HtmlArea["onkeypress"] = function(e)
			{
				return oThis.onKeyPress(e);
			};
			this.HtmlArea["onkeyup"]    = function(e)
			{
				return oThis.onKeyUp(e);
			};

			this.HtmlArea.addEventListener("input", function(e)
			{
				return oThis.onInput(e);
			}, false);
			this.HtmlArea.addEventListener("textInput", function(e)
			{
				return oThis.onTextInput(e);
			}, false);

			this.HtmlArea.addEventListener("compositionstart", function(e)
			{
				return oThis.onCompositionStart(e);
			}, false);
			this.HtmlArea.addEventListener("compositionupdate", function(e)
			{
				return oThis.onCompositionUpdate(e);
			}, false);
			this.HtmlArea.addEventListener("compositionend", function(e)
			{
				return oThis.onCompositionEnd(e);
			}, false);

			this.show(false);

			/*
			 setInterval(function(){
			 if (oThis.Api.asc_IsFocus() && !AscCommon.g_clipboardBase.IsFocus() && !AscCommon.g_clipboardBase.IsWorking())
			 {
			 if (document.activeElement != oThis.HtmlArea)
			 oThis.HtmlArea.focus();
			 }
			 }, 10);
			 */

			this.Api.Input_UpdatePos();
		},

		onResize : function(_editorContainerId)
		{
			var _elem          = document.getElementById("area_id_main");
			var _elemSrc       = document.getElementById(_editorContainerId);
			_elem.style.left   = _elemSrc.style.left;
			_elem.style.top    = _elemSrc.style.top;
			_elem.style.width  = _elemSrc.style.width;
			_elem.style.height = _elemSrc.style.height;
		},

		checkFocus : function()
		{
			if (oThis.Api.asc_IsFocus() && !AscCommon.g_clipboardBase.IsFocus() && !AscCommon.g_clipboardBase.IsWorking())
			{
				if (document.activeElement != oThis.HtmlArea)
					oThis.HtmlArea.focus();
			}
		},

		initTimer : function()
		{
			/*
			 setInterval(function(){
			 oThis.checkFocus();
			 }, 10);
			 */

			var oThis = this;
			setTimeout(function()
			{
				oThis.checkFocus();
				oThis.initTimer();
			}, 40);
		},

		move : function(x, y)
		{
			var oTarget = document.getElementById(this.TargetId);
			var xPos    = x ? x : parseInt(oTarget.style.left);
			var yPos    = (y ? y : parseInt(oTarget.style.top)) + parseInt(oTarget.style.height);

			this.HtmlDiv.style.left = xPos + "px";
			this.HtmlDiv.style.top  = yPos + this.HtmlAreaOffset + "px"; // еще бы сдвинуться на высоту строки
		},

		clear : function()
		{
			this.compositionValue = [];
			this.compositionState = c_oCompositionState.end;
			this.HtmlArea.value   = "";
		},

		show : function(isShow)
		{
			if (isShow)
			{
				// DEBUG_MODE
				this.HtmlAreaOffset       = 0;
				this.HtmlArea.style.top   = "0px";
				this.HtmlArea.style.color = "black";
				this.HtmlDiv.style.zIndex = 5;
				//this.HtmlDiv.style.width = "200px";

				document.getElementById("area_id_parent").parentNode.style.zIndex = 5;
			}
		},

		onInput : function(e)
		{
			if (AscCommon.AscBrowser.isMozilla)
			{
				if (c_oCompositionState.process == this.compositionState)
				{
					this.checkTargetPosition();
				}
			}

			var _value = this.HtmlArea.value;
			if (!this.KeyDownFlag && c_oCompositionState.end == this.compositionState && !this.TextInputAfterComposition && _value != "")
			{
				this.Api.Begin_CompositeInput();
				this.checkCompositionData(this.HtmlArea.value);
				this.Api.Replace_CompositeText(this.compositionValue);
				this.Api.End_CompositeInput();
			}

			this.TextInputAfterComposition = false;

			if (c_oCompositionState.end == this.compositionState)
			{
				if (AscCommon.AscBrowser.isChrome && AscCommon.AscBrowser.isLinuxOS)
				{
					// space!!!
					var _code = (_value.length == 1) ? _value.charCodeAt(0) : 0;
					if (_code == 12288 || _code == 32)
					{
						var _e = {
							altKey : false,
							ctrlKey : false,
							shiftKey : false,
							target : null,
							charCode : 0,
							which : 0,
							keyCode : 12288,
							code : "space"
						};
						this.Api.onKeyDown(_e);
						this.Api.onKeyUp(_e);
					}
				}

				this.clear();
			}
		},

		onTextInput : function(e)
		{
			if (this.IsUseFirstTextInputAfterComposition)
			{
				this.onCompositionEnd(e);
				this.IsUseFirstTextInputAfterComposition = false;
			}
		},

		emulateNativeKeyDown : function(e)
		{
			var oEvent = document.createEvent('KeyboardEvent');

			/*
			 var _event = new KeyboardEvent("keydown", {
			 bubbles : true,
			 cancelable : true,
			 char : e.charCode,
			 shiftKey : e.shiftKey,
			 ctrlKey : e.ctrlKey,
			 metaKey : e.metaKey,
			 altKey : e.altKey,
			 keyCode : e.keyCode,
			 which : e.which,
			 key : e.key
			 });
			 */

			// Chromium Hack
			Object.defineProperty(oEvent, 'keyCode', {
				get : function()
				{
					return this.keyCodeVal;
				}
			});
			Object.defineProperty(oEvent, 'which', {
				get : function()
				{
					return this.keyCodeVal;
				}
			});

			var k = e.keyCode;
			if (oEvent.initKeyboardEvent)
			{
				oEvent.initKeyboardEvent("keydown", true, true, window, false, false, false, false, k, k);
			}
			else
			{
				oEvent.initKeyEvent("keydown", true, true, window, false, false, false, false, k, 0);
			}

			oEvent.keyCodeVal = k;

			var _elem = _getElementKeyboardDown(this.nativeFocusElement, 3);
			_elem.dispatchEvent(oEvent);

			return oEvent.defaultPrevented;
		},

		onKeyDown : function(e)
		{
			if (c_oCompositionState.end != this.compositionState)
			{
				if (this.IsUseFirstTextInputAfterComposition && e.keyCode == 8 || e.keyCode == 46) // del, backspace
				{
					this.onCompositionEnd(e, this.HtmlArea.value);
					this.IsUseFirstTextInputAfterComposition = false;
				}

				return;
			}

			if (null != this.nativeFocusElement)
			{
				if (this.emulateNativeKeyDown(e))
				{
					e.preventDefault();
					return false;
				}
			}

			// некоторые рукописные вводы не присылают keyUp
			var _code = e.keyCode;
			if (_code != 8 && _code != 46)
				this.KeyDownFlag = true;

			return this.Api.onKeyDown(e);
		},

		onKeyPress : function(e)
		{
			if (c_oCompositionState.end != this.compositionState)
				return;

			return this.Api.onKeyPress(e);
		},

		onKeyUp : function(e)
		{
			this.KeyDownFlag = false;

			if (c_oCompositionState.end != this.compositionState)
			{
				if (this.IsUseFirstTextInputAfterComposition && e.keyCode == 8 || e.keyCode == 46) // del, backspace
				{
					this.onCompositionEnd(e, this.HtmlArea.value);
					this.IsUseFirstTextInputAfterComposition = false;
				}

				return;
			}

			if (c_oCompositionState.end == this.compositionState)
				return this.Api.onKeyUp(e);

			if (AscCommon.AscBrowser.isChrome ||
				AscCommon.AscBrowser.isSafari ||
				AscCommon.AscBrowser.isIE)
			{
				this.checkTargetPosition();
			}
		},

		checkTargetPosition : function()
		{
			var _offset = this.HtmlArea.selectionEnd;
			_offset -= (this.HtmlArea.value.length - this.compositionValue.length);
			this.Api.Set_CursorPosInCompositeText(_offset);

			this.unlockTarget();
		},

		lockTarget : function()
		{
			if (!this.IsLockTargetMode)
				return;

			if (-1 != this.LockerTargetTimer)
				clearTimeout(this.LockerTargetTimer);

			this.Api.asc_LockTargetUpdate(true);

			var oThis              = this;
			this.LockerTargetTimer = setTimeout(function()
			{
				oThis.unlockTarget();
			}, 1000);
		},

		unlockTarget : function()
		{
			if (!this.IsLockTargetMode)
				return;

			if (-1 != this.LockerTargetTimer)
				clearTimeout(this.LockerTargetTimer);
			this.LockerTargetTimer = -1;

			this.Api.asc_LockTargetUpdate(false);
		},

		onCompositionStart : function(e)
		{
			this.compositionState = c_oCompositionState.start;
			this.Api.Begin_CompositeInput();
		},

		onCompositionUpdate : function(e, isLockTarget, _data)
		{
			var _old = this.compositionValue.splice(0);
			this.checkCompositionData((_data != null) ? _data : e.data);

			var _isEqualLen = (_old.length == this.compositionValue.length);
			var _isEqual    = _isEqualLen;
			if (_isEqual)
			{
				var _len = this.compositionValue.length;
				for (var i = 0; i < _len; i++)
				{
					if (_old[i] != this.compositionValue[i])
					{
						_isEqual = false;
						break;
					}
				}
			}

			if (isLockTarget !== false)
				this.lockTarget();

			var _isNeedSavePos = !this.IsLockTargetMode;
			if (!_isEqual)
			{
				var _old = 0;
				var _max = 0;
				if (_isNeedSavePos)
				{
					_old = this.Api.Get_CursorPosInCompositeText();
					_max = this.Api.Get_MaxCursorPosInCompositeText();
				}
				this.Api.Replace_CompositeText(this.compositionValue);
				if (_isNeedSavePos)
				{
					if (_old != _max)
						this.Api.Set_CursorPosInCompositeText(_old);
				}
			}

			this.compositionState = c_oCompositionState.process;
		},

		onCompositionEnd : function(e, _data)
		{
			if (!this.IsUseFirstTextInputAfterComposition &&
				AscCommon.AscBrowser.isChrome &&
				AscCommon.AscBrowser.isLinuxOS &&
				(e.data == null || e.data == ""))
			{
				// always data == ""
				this.IsUseFirstTextInputAfterComposition = true;
				return;
			}

			this.onCompositionUpdate(e, false, _data);
			this.Api.Set_CursorPosInCompositeText(1000); // max

			this.clear();
			this.Api.End_CompositeInput();

			this.unlockTarget();
			this.TextInputAfterComposition = true;
		},

		checkCompositionData : function(data)
		{
			this.compositionValue = [];
			var _length           = (data != null) ? data.length : 0;
			for (var i = 0; i < _length; i++)
			{
				var _code = data.charCodeAt(i);
				if ((_code < 0xD800 || _code >= 0xDC00) || i >= (_length - 1))
					this.compositionValue.push(_code);
				else
				{
					i++;
					var _code2 = data.charCodeAt(i);
					if (_code2 < 0xDC00 || _code2 >= 0xDFFF)
					{
						this.compositionValue.push(_code);
						this.compositionValue.push(_code2);
					}
					else
					{
						this.compositionValue.push(((_code & 0x3FF) << 10) | (_code2 & 0x3FF));
					}
				}
			}
		},

		setInterfaceEnableKeyEvents : function(value)
		{
			this.InterfaceEnableKeyEvents = value;
			if (true == this.InterfaceEnableKeyEvents)
			{
				this.HtmlArea.focus();
			}
		}
	};

	function _getAttirbute(_elem, _attr, _depth)
	{
		var _elemTest = _elem;
		for (var _level = 0; _elemTest && (_level < _depth); ++_level, _elemTest = _elemTest.parentNode)
		{
			var _res = _elemTest.getAttribute ? _elemTest.getAttribute(_attr) : null;
			if (null != _res)
				return _res;
		}
		return null;
	}
	function _getElementKeyboardDown(_elem, _depth)
	{
		var _elemTest = _elem;
		for (var _level = 0; _elemTest && (_level < _depth); ++_level, _elemTest = _elemTest.parentNode)
		{
			var _res = _elemTest.getAttribute ? _elemTest.getAttribute("oo_editor_keyboard") : null;
			if (null != _res)
				return _elemTest;
		}
		return null;
	}
	function _getDefaultKeyboardInput(_elem, _depth)
	{
		var _elemTest = _elem;
		for (var _level = 0; _elemTest && (_level < _depth); ++_level, _elemTest = _elemTest.parentNode)
		{
			var _name = " " + _elemTest.className + " ";
			if (_name.indexOf(" dropdown-menu" ) > -1 ||
				_name.indexOf(" dropdown-toggle ") > -1 ||
				_name.indexOf(" dropdown-submenu ") > -1 ||
				_name.indexOf(" canfocused ") > -1)
			{
				return "true";
			}
		}
		return null;
	}

	window['AscCommon']            = window['AscCommon'] || {};
	window['AscCommon'].CTextInput = CTextInput;

	window['AscCommon'].InitBrowserInputContext = function(api, target_id)
	{
		window['AscCommon'].g_inputContext = new CTextInput(api);
		window['AscCommon'].g_inputContext.init(target_id);
		window['AscCommon'].g_clipboardBase.Init(api);
		window['AscCommon'].g_clipboardBase.inputContext = window['AscCommon'].g_inputContext;

		document.addEventListener("focus", function(e)
		{
			var t                = window['AscCommon'].g_inputContext;
			t.nativeFocusElement = e.target;

			console.log(t.nativeFocusElement);

			if (t.InterfaceEnableKeyEvents == false)
			{
				t.nativeFocusElement = null;
				return;
			}

			if (t.nativeFocusElement.id == t.HtmlArea.id)
			{
				t.Api.asc_enableKeyEvents(true, true);
				t.nativeFocusElement = null;
				return;
			}
			if (t.nativeFocusElement.id == window['AscCommon'].g_clipboardBase.CommonDivId)
			{
				t.nativeFocusElement = null;
				return;
			}

			var _isElementEditable = false;
			if (true)
			{
				// detect _isElementEditable
				var _name = t.nativeFocusElement.nodeName;
				if (_name)
					_name = _name.toUpperCase();

				if ("INPUT" == _name || "TEXTAREA" == _name)
					_isElementEditable = true;
				else if ("DIV" == _name)
				{
					if (t.nativeFocusElement.getAttribute("contenteditable") == "true")
						_isElementEditable = true;
				}
			}
			if ("IFRAME" == _name)
			{
				// перехват клавиатуры
				t.Api.asc_enableKeyEvents(false, true);
				t.nativeFocusElement = null;
				return;
			}

			// перехватывает ли элемент ввод
			var _oo_editor_input    = _getAttirbute(t.nativeFocusElement, "oo_editor_input", 3);
			// нужно ли прокидывать нажатие клавиш элементу (ТОЛЬКО keyDown)
			var _oo_editor_keyboard = _getAttirbute(t.nativeFocusElement, "oo_editor_keyboard", 3);

			if (!_oo_editor_input && !_oo_editor_keyboard)
				_oo_editor_input = _getDefaultKeyboardInput(t.nativeFocusElement, 3);

			if (_oo_editor_keyboard == "true")
				_oo_editor_input = undefined;

			if (_oo_editor_input == "true")
			{
				// перехват клавиатуры
				t.Api.asc_enableKeyEvents(false, true);
				t.nativeFocusElement = null;
				return;
			}

			if (_isElementEditable && (_oo_editor_input != "false"))
			{
				// перехват клавиатуры
				t.Api.asc_enableKeyEvents(false, true);
				t.nativeFocusElement = null;
				return;
			}

			// итак, ввод у нас. теперь определяем, нужна ли клавиатура элементу
			if (_oo_editor_keyboard != "true")
				t.nativeFocusElement = null;

			var _elem = t.nativeFocusElement;
			t.HtmlArea.focus();
			t.nativeFocusElement = _elem;
			t.Api.asc_enableKeyEvents(true, true);

		}, true);

		// send focus
		window['AscCommon'].g_inputContext.HtmlArea.focus();
	};
})(window);
