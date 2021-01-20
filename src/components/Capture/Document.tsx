import { h, Component } from 'preact'

import { isDesktop, isHybrid, addDeviceRelatedProperties } from '~utils'
import { validateFile } from '~utils/file'
import { compose } from '~utils/func'
import { getInactiveError } from '~utils/inactiveError'
import { DOCUMENT_CAPTURE_LOCALES_MAPPING } from '~utils/localesMapping'
import { randomId } from '~utils/string'

import { appendToTracking } from '../../Tracker'
import { localised, LocalisedType } from '../../locales'
import DocumentAutoCapture from '../Photo/DocumentAutoCapture'
import DocumentLiveCapture from '../Photo/DocumentLiveCapture'
import VideoCapture from '../VideoCapture'
import Uploader from '../Uploader'
import PageTitle from '../PageTitle'
import CustomFileInput from '../CustomFileInput'
import { getDocumentTypeGroup } from '../DocumentSelector/documentTypes'
import FallbackButton from '../Button/FallbackButton'
import { DocumentOverlay } from '../Overlay'

import withCrossDeviceWhenNoCamera from './withCrossDeviceWhenNoCamera'
import style from './style.scss'

import type { ImageResizeInfo } from '~types/commons'
import type { DocumentCapture } from '~types/redux'
import type {
  HandleCaptureProp,
  StepComponentDocumentProps,
} from '~types/routers'
import type { Options as OptionsProps } from './withOptions'

type Props = StepComponentDocumentProps & LocalisedType & OptionsProps

class Document extends Component<Props> {
  static defaultProps: Partial<Props> = {
    forceCrossDevice: false,
    requestedVariant: 'standard',
    side: 'front',
  }

  handleCapture: HandleCaptureProp = ({ variant, ...payload }) => {
    const {
      actions,
      documentType,
      isPoA,
      mobileFlow,
      nextStep,
      poaDocumentType,
      side,
    } = this.props

    const documentCaptureData: DocumentCapture = {
      ...payload,
      documentType: isPoA ? poaDocumentType : documentType,
      id: payload.id || randomId(),
      method: 'document',
      sdkMetadata: addDeviceRelatedProperties(payload.sdkMetadata, mobileFlow),
      side,
      variant: variant || 'standard',
    }
    actions.createCapture(documentCaptureData)

    nextStep()
  }

  handleUpload = (blob: Blob, imageResizeInfo: ImageResizeInfo) =>
    this.handleCapture({
      blob,
      sdkMetadata: { captureMethod: 'html5', imageResizeInfo },
    })

  handleError = () => this.props.actions.deleteCapture({ method: 'face' })

  handleFileSelected = (file: File) =>
    validateFile(file, this.handleUpload, this.handleError)

  renderUploadFallback = (text: string) => (
    <CustomFileInput
      className={style.uploadFallback}
      onChange={this.handleFileSelected}
      accept="image/*"
      capture
    >
      {text}
    </CustomFileInput>
  )

  renderCrossDeviceFallback = (text: string) => (
    <FallbackButton
      text={text}
      onClick={() => this.props.changeFlowTo('crossDeviceSteps')}
    />
  )

  render() {
    const {
      documentType,
      hasCamera,
      isPoA,
      poaDocumentType,
      requestedVariant,
      side,
      translate,
      uploadFallback,
      useLiveDocumentCapture,
      useWebcam,
    } = this.props

    const title = translate(
      DOCUMENT_CAPTURE_LOCALES_MAPPING[isPoA ? poaDocumentType : documentType][
        side
      ].title
    )
    const propsWithErrorHandling = { ...this.props, onError: this.handleError }
    const renderTitle = <PageTitle title={title} smaller />
    const renderFallback = isDesktop
      ? this.renderCrossDeviceFallback
      : this.renderUploadFallback
    const enableLiveDocumentCapture =
      useLiveDocumentCapture && (!isDesktop || isHybrid)

    if (requestedVariant === 'video') {
      const isUploadFallbackDisabled = !isDesktop && !this.props.uploadFallback

      return (
        <VideoCapture
          cameraClassName={style.faceContainer}
          inactiveError={getInactiveError(isUploadFallbackDisabled)}
          method="document"
          onRedo={() => console.log('redo')}
          onVideoCapture={(payload) =>
            this.handleCapture({ ...payload, variant: 'video' })
          }
          renderFallback={renderFallback}
          trackScreen={this.props.trackScreen}
        >
          <DocumentOverlay type={documentType} />
        </VideoCapture>
      )
    }

    if (hasCamera && useWebcam) {
      return (
        <DocumentAutoCapture
          {...propsWithErrorHandling}
          renderFallback={renderFallback}
          onValidCapture={this.handleCapture}
        />
      )
    }

    if (hasCamera && enableLiveDocumentCapture) {
      return (
        <DocumentLiveCapture
          {...propsWithErrorHandling}
          containerClassName={style.liveDocumentContainer}
          isUploadFallbackDisabled={!uploadFallback}
          onCapture={this.handleCapture}
          renderFallback={renderFallback}
          renderTitle={renderTitle}
        />
      )
    }

    // Different upload types show different icons
    // return the right icon name for document
    // For document, the upload can be 'identity' or 'proof_of_address'
    const uploadType = getDocumentTypeGroup(poaDocumentType || documentType)
    const instructions = translate(
      DOCUMENT_CAPTURE_LOCALES_MAPPING[isPoA ? poaDocumentType : documentType][
        side
      ].body
    )

    return (
      <Uploader
        {...propsWithErrorHandling}
        uploadType={uploadType}
        onUpload={this.handleUpload}
        title={title}
        instructions={instructions}
      />
    )
  }
}

export default compose(
  appendToTracking,
  localised,
  withCrossDeviceWhenNoCamera
)(Document)
