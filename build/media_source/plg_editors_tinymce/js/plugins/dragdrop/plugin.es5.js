(function () {
  'use strict';

  /* eslint-disable no-undef */
  tinymce.PluginManager.add('jdragndrop', function (editor) {
    var responseData; // Reset the drop area border

    tinyMCE.DOM.bind(document, 'dragleave', function (e) {
      e.stopPropagation();
      e.preventDefault();
      editor.contentAreaContainer.style.borderWidth = '1px 0 0';
      return false;
    }); // Fix for Chrome

    editor.on('dragenter', function (e) {
      e.stopPropagation();
      return false;
    }); // Notify user when file is over the drop area

    editor.on('dragover', function (e) {
      e.preventDefault();
      editor.contentAreaContainer.style.borderStyle = 'dashed';
      editor.contentAreaContainer.style.borderWidth = '5px';
      return false;
    });

    function uploadFile(name, content) {
      var _data;

      var url = editor.settings.uploadUri + "&path=" + editor.settings.comMediaAdapter;
      var data = (_data = {}, _data[editor.settings.csrfToken] = '1', _data.name = name, _data.content = content, _data.parent = editor.settings.parentUploadFolder, _data);
      Joomla.request({
        url: url,
        method: 'POST',
        data: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        onSuccess: function onSuccess(resp) {
          var response;

          try {
            response = JSON.parse(resp);
          } catch (e) {
            editor.windowManager.alert(Joomla.Text._('ERROR') + ": {e}");
          }

          if (response.data && response.data.path) {
            responseData = response.data;
            var urlPath; // For local adapters use relative paths

            if (/local-/.test(responseData.adapter)) {
              var _Joomla$getOptions = Joomla.getOptions('system.paths'),
                  rootFull = _Joomla$getOptions.rootFull;

              urlPath = "" + response.data.url.split(rootFull)[1];
            } else if (responseData.url) {
              // Absolute path for different domain
              urlPath = responseData.url;
            }

            var dialogClose = function dialogClose(api) {
              var dialogData = api.getData();
              var altEmpty = dialogData.altEmpty ? ' alt=""' : '';
              var altValue = dialogData.altText ? " alt=\"" + dialogData.altText + "\"" : altEmpty;
              var lazyValue = dialogData.isLazy ? ' loading="lazy"' : '';
              var width = dialogData.isLazy ? " width=\"" + responseData.width + "\"" : '';
              var height = dialogData.isLazy ? " height=\"" + responseData.height + "\"" : '';
              editor.execCommand('mceInsertContent', false, "<img src=\"" + urlPath + "\"" + altValue + lazyValue + width + height + "/>");
            };

            editor.windowManager.open({
              title: Joomla.Text._('PLG_TINY_DND_ADDITIONALDATA'),
              body: {
                type: 'panel',
                items: [{
                  type: 'input',
                  name: 'altText',
                  label: Joomla.Text._('PLG_TINY_DND_ALTTEXT')
                }, {
                  type: 'checkbox',
                  name: 'altEmpty',
                  label: Joomla.Text._('PLG_TINY_DND_EMPTY_ALT')
                }, {
                  type: 'checkbox',
                  name: 'isLazy',
                  label: Joomla.Text._('PLG_TINY_DND_LAZYLOADED')
                }]
              },
              buttons: [{
                type: 'cancel',
                text: 'Cancel'
              }, {
                type: 'submit',
                name: 'submitButton',
                text: 'Save',
                primary: true
              }],
              initialData: {
                altText: '',
                isLazy: true,
                altEmpty: false
              },
              onSubmit: function onSubmit(api) {
                dialogClose(api);
                api.close();
              },
              onCancel: function onCancel(api) {
                dialogClose(api);
              }
            });
          }
        },
        onError: function onError(xhr) {
          editor.windowManager.alert("Error: " + xhr.statusText);
        }
      });
    }

    function readFile(file) {
      // Create a new file reader instance
      var reader = new FileReader(); // Add the on load callback

      reader.onload = function (progressEvent) {
        var result = progressEvent.target.result;
        var splitIndex = result.indexOf('base64') + 7;
        var content = result.slice(splitIndex, result.length); // Upload the file

        uploadFile(file.name, content);
      };

      reader.readAsDataURL(file);
    } // Listeners for drag and drop


    if (typeof FormData !== 'undefined') {
      // Logic for the dropped file
      editor.on('drop', function (e) {
        e.preventDefault(); // We override only for files

        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          var files = [].slice.call(e.dataTransfer.files);
          files.forEach(function (file) {
            // Only images allowed
            if (file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
              // Upload the file(s)
              readFile(file);
            }
          });
        }

        editor.contentAreaContainer.style.borderWidth = '1px 0 0';
      });
    } else {
      Joomla.renderMessages({
        error: [Joomla.Text._('PLG_TINY_ERR_UNSUPPORTEDBROWSER')]
      });
      editor.on('drop', function (e) {
        e.preventDefault();
        return false;
      });
    }
  });

}());
