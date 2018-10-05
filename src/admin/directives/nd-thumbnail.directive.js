/**
 * ndThumbnail Directives
 * Thumbnail 上传组件
 */
angular.module('directives').directive('ndThumbnail', [
  '$templateCache', '$timeout', '$filter', '$http', 'Upload', 'base64ToBlobFile',
  function($templateCache, $timeout, $filter, $http, Upload, base64ToBlobFile) {
    return {
      restrict: 'E',
      template: $templateCache.get('thumbnail.view.html'),
      scope: {
        thumbnail: '=',
        disabled: '=',
        width: '=',
        height: '='
      },
      link: function(scope, element, attrs, ctrl) {
        'use strict';

        /**
         * 初始化变量
         */
        scope.thumbnail = {
          _id: scope.thumbnail._id || null,
          file: null,
          sourceImage: '',
          croppedImage: scope.thumbnail.croppedImage || '',
          uploadStatus: scope.thumbnail.uploadStatus || 'initial'
        };
        scope.minWidth = scope.width / 2;
        scope.minHeight = scope.height / 2;
        scope.options = {
          maximize: true,
          aspectRatio: scope.width / scope.height
        };

        /**
         * 裁剪缩略图
         * @param files 文件名
         */
        scope.cropThumbnail = function(files) {
          if (_.isEmpty(files)) return false;

          scope.thumbnail.file = files[0];

          var reader = new FileReader();
          reader.onload = function(e) {
            scope.$apply(function() {
              scope.thumbnail.sourceImage = e.target.result;
              setTimeout(function() {
                $('#cropper').cropper(scope.options);
              }, 500);
            });
          };
          reader.readAsDataURL(scope.thumbnail.file);
          $('#corpModal').modal('show');
        };

        /**
         * 关闭裁剪窗后清空 $scope.thumbnail
         */
        $('#corpModal').on('hide.bs.modal', function() {
          if (scope.thumbnail.uploadStatus === 'initial') {
            scope.$apply(function() {
              scope.thumbnail = {
                _id: null,
                file: null,
                sourceImage: '',
                croppedImage: '',
                uploadStatus: 'initial'
              };
            });
          }
        });

        /**
         * 上传缩略图
         */
        scope.uploadThumbnail = function() {
          scope.thumbnail.uploadStatus = 'uploading';

          var dataUrl = $('#cropper').cropper('getCroppedCanvas').toDataURL();
          var file = base64ToBlobFile(dataUrl, scope.thumbnail.file.name.replace(/\.\w+$/, '') + '.jpg', 'image/jpeg');

          Upload.upload({
            url: '/api/media',
            data: {
              file: file
            }
          }).then(function(res) {
            var data = res.data;

            scope.thumbnail.uploadStatus = 'success';
            scope.thumbnail.croppedImage = data.src;
            scope.thumbnail._id = data._id;
          }, function() {
            scope.$emit('notification', {
              type: 'danger',
              message: '缩略图上传失败'
            });
          });

          $('#corpModal').modal('hide');
        };

        /**
         * 删除缩略图
         */
        scope.removeThumbnail = function() {
          scope.thumbnail = {
            _id: null,
            file: null,
            sourceImage: '',
            croppedImage: '',
            uploadStatus: 'initial'
          };
        };
      }
    };
  }
]);
