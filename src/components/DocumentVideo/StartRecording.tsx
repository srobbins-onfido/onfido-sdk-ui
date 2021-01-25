import { h, FunctionComponent } from 'preact'

import { localised } from '../../locales'
import Button from '../Button'
import style from './style.scss'

import type { WithLocalisedProps } from '~types/hocs'

type StartRecordingProps = {
  disableInteraction: boolean
  onClick: () => void
}

type Props = StartRecordingProps & WithLocalisedProps

const StartRecording: FunctionComponent<Props> = ({
  disableInteraction,
  onClick,
  translate,
}) => (
  <div className={style.actions}>
    <Button
      variants={['centered', 'primary', 'lg']}
      disabled={disableInteraction}
      onClick={onClick}
    >
      {translate('doc_video_capture.button_record_accessibility')}
    </Button>
  </div>
)

export default localised(StartRecording)
